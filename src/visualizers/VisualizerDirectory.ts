import "reflect-metadata";
import {VisualizersMap} from "./VisualizersMap";
import {LinkType} from "../link/ScreenLink";

export interface VisualizerInfo {
    Constructor: any;
    label: string;
    p5mode: string;
    inputs?: InputInfo[];
    options?: OptionInfo[];
}

export interface OptionInfo {
    label: string;
    options: string[];
    propertyKey: string;
}

export interface InputInfo {
    showPanel: boolean;
    label: string | undefined;
    min?: number;
    max?: number;
    type: LinkType;
    propertyKey: string;
}


export class VisualizerDirectory {

    _info: Map<string, VisualizerInfo>;

    constructor() {
        const __FIELD_VISUALIZERS_METADATA_KEY = "Field.Visualizers.Metadata.Key";
        this._info = new Map<string, VisualizerInfo>();
        let property: keyof typeof VisualizersMap;
        for (property in VisualizersMap) {
            const info = Reflect.getMetadata(__FIELD_VISUALIZERS_METADATA_KEY, VisualizersMap[property]) as VisualizerInfo;
            info.Constructor = VisualizersMap[property];
            this._info.set(info.label, info);
        }
    }

    public get visualizers(): VisualizerInfo[] {
        const all: VisualizerInfo[] = [];
        this._info.forEach((v) => all.push(v));
        return all
    }
}

export function visualizer(label: string, p5mode: "2d" | "webgl") {
    return function (constructor: Function) {
        const __FIELD_VISUALIZERS_METADATA_KEY = "Field.Visualizers.Metadata.Key";

        const meta = Reflect.getMetadata(__FIELD_VISUALIZERS_METADATA_KEY, constructor) || {};
        meta.label = label;
        meta.p5mode = p5mode;
        Reflect.defineMetadata(__FIELD_VISUALIZERS_METADATA_KEY, meta, constructor);
    };
}

export function numberInput(label: string, from: number, to: number) {
    return function (target: Object, propertyKey: string | symbol) {
        const __FIELD_VISUALIZERS_METADATA_KEY = "Field.Visualizers.Metadata.Key";

        const metaData = Reflect.getMetadata(__FIELD_VISUALIZERS_METADATA_KEY, target.constructor) || {};
        metaData.inputs ||= [];
        metaData.inputs.push({label, min: from, max: to, propertyKey, type: "number", showPanel: true} as InputInfo);
        Reflect.defineMetadata(__FIELD_VISUALIZERS_METADATA_KEY, metaData, target.constructor);
    }
}

export function colorInput(label: string) {
    return function(target: Object, propertyKey: string | symbol) {
        const __FIELD_VISUALIZERS_METADATA_KEY = "Field.Visualizers.Metadata.Key";

        const metaData = Reflect.getMetadata(__FIELD_VISUALIZERS_METADATA_KEY, target.constructor) || {};
        metaData.inputs ||= [];
        metaData.inputs.push({label, propertyKey, type: "color", showPanel: true} as InputInfo);
        Reflect.defineMetadata(__FIELD_VISUALIZERS_METADATA_KEY, metaData, target.constructor);

    }
}

export function imageInput(label: string) {
    return function(target: Object, propertyKey: string | symbol) {
        const __FIELD_VISUALIZERS_METADATA_KEY = "Field.Visualizers.Metadata.Key";

        const metaData = Reflect.getMetadata(__FIELD_VISUALIZERS_METADATA_KEY, target.constructor) || {};
        metaData.inputs ||= [];
        metaData.inputs.push({label, propertyKey, type: "image", showPanel: true} as InputInfo);
        Reflect.defineMetadata(__FIELD_VISUALIZERS_METADATA_KEY, metaData, target.constructor);

    }
}

export function booleanInput(label: string) {
    return function(target: Object, propertyKey: string | symbol) {
        const __FIELD_VISUALIZERS_METADATA_KEY = "Field.Visualizers.Metadata.Key";

        const metaData = Reflect.getMetadata(__FIELD_VISUALIZERS_METADATA_KEY, target.constructor) || {};
        metaData.inputs ||= [];
        metaData.inputs.push({label, propertyKey, type: "boolean", showPanel: true} as InputInfo);
        Reflect.defineMetadata(__FIELD_VISUALIZERS_METADATA_KEY, metaData, target.constructor);

    }
}

export function namesInput() {
    return function(target: Object, propertyKey: string | symbol) {
        const __FIELD_VISUALIZERS_METADATA_KEY = "Field.Visualizers.Metadata.Key";

        const metaData = Reflect.getMetadata(__FIELD_VISUALIZERS_METADATA_KEY, target.constructor) || {};
        metaData.inputs ||= [];
        metaData.inputs.push({propertyKey, type: "names", showPanel: false} as InputInfo);
        Reflect.defineMetadata(__FIELD_VISUALIZERS_METADATA_KEY, metaData, target.constructor);

    }
}

export function selectOption(label: string, options: string[]) {
    return function(target: Object, propertyKey: string | symbol) {
        const __FIELD_VISUALIZERS_METADATA_KEY = "Field.Visualizers.Metadata.Key";

        const metaData = Reflect.getMetadata(__FIELD_VISUALIZERS_METADATA_KEY, target.constructor) || {};
        metaData.options ||= [];
        metaData.options.push({label, options, propertyKey} as OptionInfo);
        Reflect.defineMetadata(__FIELD_VISUALIZERS_METADATA_KEY, metaData, target.constructor);
    }
}

