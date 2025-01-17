import {NeurosityDataProcessor} from "../neurosity-adapter/NeurosityDataProcessor";
import {DataSourceInfos, KeysOfNeurosityData, NeurosityData} from "../neurosity-adapter/OutputDataSource";
import {
    __BROADCAST_CHANNEL_NAME__,
    __BROADCAST_IMAGE_CHANNEL_NAME__,
    __BROADCAST_IMAGE_REQUEST_CHANNEL_NAME__,
    __BROADCAST_NAMES_CHANNEL_NAME__,
    ImageMessage,
    InputData,
    NumberLink,
    ParameterMaps
} from "./ScreenLink";
import {Settings} from "../services/Settings";
import {BehaviorSubject, interval, Observable, Subject, withLatestFrom} from "rxjs";
import {IVisualizerColor} from "../visualizers/IVisualizer";
import {ColorGenerator} from "./ColorGenerator";
import {OutputMapStore} from "./OutputMapStore";
import {forEach} from "lodash";
import {BooleanGenerator} from "./BooleanGenerator";

export interface VisualizerChange {
    visualizer: string | null;
}

export class ScreenLinkTransmitter {
    private _store: OutputMapStore;
    private _dataProcessor: NeurosityDataProcessor;
    private _channel: BroadcastChannel;
    private _namesChannel: BroadcastChannel;
    private _imageChannel: BroadcastChannel;
    private _requestChannel: BroadcastChannel;
    private _visualizerKey: string | null;
    private _settings: Settings;
    private readonly _visualizerStorageKey = "selectedVisualizer";
    private readonly _visualizerChange$ = new Subject<VisualizerChange>()

    private readonly _paused$ = new BehaviorSubject<boolean>(false);
    private readonly _reset$ = new BehaviorSubject<number>(0);
    private readonly _request$ = new Subject();
    private _reset = 0;

    constructor(dataProcessor: NeurosityDataProcessor, settings: Settings, store: OutputMapStore) {
        this._settings = settings;
        this._dataProcessor = dataProcessor;
        this._store = store;
        this._channel = new BroadcastChannel(__BROADCAST_CHANNEL_NAME__);
        this._namesChannel = new BroadcastChannel(__BROADCAST_NAMES_CHANNEL_NAME__);
        this._imageChannel = new BroadcastChannel(__BROADCAST_IMAGE_CHANNEL_NAME__);
        this._requestChannel = new BroadcastChannel(__BROADCAST_IMAGE_REQUEST_CHANNEL_NAME__);

        this._requestChannel.onmessage = () => {
            this._request$.next(null);
        };

        // For now, we are resending all the images on request.
        // No support for changing images in runtime.
        this._request$.pipe(
            withLatestFrom(this._store.parameterMap$)
        ).subscribe(([_, parameterMaps]) => {
            // Set all the images at once.
            forEach(parameterMaps, (map, mapKey) => {
                forEach(map.links, (link, linkIndex) => {
                    if (link.type === "image" && link.imageLink) {
                        const key = `${mapKey}:${linkIndex}`;
                        const message: ImageMessage = {
                            key: key,
                            url: link.imageLink!.imageUrl,
                        };
                        this._imageChannel.postMessage(message);
                    }
                });
            });
            this._imageChannel.postMessage({key: "DONE"}); // I do not love this
        });

        this._dataProcessor.data$
            .pipe(
                withLatestFrom(this._reset$, this._paused$, this._store.parameterMap$),
            )
            .subscribe(([data, reset, paused, parameterMaps]) => {
                const message = this.mapData(data, reset, paused, parameterMaps);
                this._channel.postMessage(message);
            });


        interval(2000).pipe(
            withLatestFrom(this._store.parameterMap$)
        ).subscribe(([i, parameterMaps]) => {
            this._namesChannel.postMessage(this.getNameMap(parameterMaps));
        });

        this._visualizerKey = this._settings.getProp<string>(this._visualizerStorageKey) || null;
    }

    private static getNumberLinkValue(link: NumberLink | null | undefined, data: NeurosityData): number {
        if (link) {
            let value = link.outputKey ? data[link.outputKey] : link.manualValue;
            value = ScreenLinkTransmitter.mapValue(value, link.curve);

            if (Number.isNaN(value)) value = 0.0;

            if (link.lowValue === link.highValue) return 0;
            if (link.lowValue <= link.highValue) {
                return link.lowValue + (link.highValue - link.lowValue) * value;
            } else {
                let unwrapped = link.lowValue + (link.highValue - link.lowValue + 1) * value;
                if (unwrapped > 1.0) unwrapped -= 1.0;
                return unwrapped;
            }
        }
        return 0;
    }

    private static mapValue(value: number, curve?: string) {
        switch (curve) {
            case "linear":
                return value;
            case "reverse_linear":
                return 1 - value;
            case "sigmoid":
                return 1 / (1 + Math.exp(-10 * (value - 0.5)));
            case "reverse_sigmoid":
                return 1 - (1 / (1 + Math.exp(-10 * (value - 0.5))));
            case "gamma":
                return Math.pow(value, 3);
            case "reverse_gamma":
                return 1 - Math.pow(value, 3);
            case "center":
                return (Math.log(value / (1 - value)) + 3) / 6;
            case "reverse_center":
                return 1 - ((Math.log(value / (1 - value)) + 3) / 6);
            default:
                return value;
        }
    }

    private getOutputKey(link: { outputKey?: string | null }): string {
        if (link.outputKey && link.outputKey in DataSourceInfos) {
            return DataSourceInfos[link.outputKey as KeysOfNeurosityData].name;
        }
        return link.outputKey ?? "Manual";
    }

    private getNameMap(parameterMaps: ParameterMaps): { [key: string]: string } {
        if (!this._visualizerKey) {
            return {};
        }

        return parameterMaps[this._visualizerKey].links.reduce((result, link) => {
            switch (link.type) {
                case "number":
                    if (link.numberLink) {
                        result[link.propertyKey] = this.getOutputKey(link.numberLink);
                    }
                    break;
                case "boolean":
                    if (link.booleanLink) {
                        result[link.propertyKey] = this.getOutputKey(link.booleanLink.numberLink);
                    }
                    break;
            }
            return result;
        }, {} as { [key: string]: string });
    }

    private mapData(data: NeurosityData, reset: number, paused: boolean, parameterMaps: ParameterMaps): InputData {
        let parameters: (number | IVisualizerColor | boolean | string | undefined)[] = [];
        let options: number[] = [];

        if (this._visualizerKey) {
            parameters = parameterMaps[this._visualizerKey].links
                .map((link, link_index) => {
                    switch (link.type) {
                        case "number":
                            return ScreenLinkTransmitter.getNumberLinkValue(link.numberLink, data);
                        case "color":
                            if (link.colorLink) {
                                const values = link.colorLink!.colorModeLinks[link.colorLink.colorMode];
                                if (values) {
                                    const a = ScreenLinkTransmitter.getNumberLinkValue(values.links[0], data);
                                    const b = ScreenLinkTransmitter.getNumberLinkValue(values.links[1], data);
                                    const c = ScreenLinkTransmitter.getNumberLinkValue(values.links[2] || 0, data);
                                    return ColorGenerator(link.colorLink!.colorMode, a, b, c, `${this._visualizerKey}:${link.propertyKey}`);
                                }
                            }
                            return {red: 0, green: 0.8, blue: 0.0};
                        case "boolean":
                            if (link.booleanLink) {
                                const value = ScreenLinkTransmitter.getNumberLinkValue(link.booleanLink.numberLink, data);
                                return BooleanGenerator(link.booleanLink.modulation, value, link.booleanLink.threshold, `${this._visualizerKey}:${link.propertyKey}`);
                            }
                            return true;
                        case "image":
                            if (link.imageLink) {
                                const key = `${this._visualizerKey}:${link_index}`
                                return key;
                            }
                            return undefined;
                        default:
                            return 0.0;
                    }
                });

            options = parameterMaps[this._visualizerKey].options
                .map((option, option_index) => {
                    return option.value | 0;
                });
        }
        return {
            visualizerLabel: this._visualizerKey,
            parameters: parameters,
            options: options,
            paused: paused,
            reset: reset,
        }
    }

    public getVisualizer(): string | null {
        return this._visualizerKey;
    }

    public get visualizerChanges$(): Observable<VisualizerChange> {
        return this._visualizerChange$;
    }


    public setVisualizer(visualizerKey: string | null) {
        this._visualizerKey = visualizerKey;
        this._settings.setProp(this._visualizerStorageKey, this._visualizerKey);
        this._visualizerChange$.next({visualizer: visualizerKey})
    }

    public paused$(): Observable<boolean> {
        return this._paused$;
    }

    public pause() {
        this._paused$.next(true);
    }

    public play() {
        this._paused$.next(false);
    }

    public reset() {
        this._reset += 1;
        this._reset$.next(this._reset);
    }
}
