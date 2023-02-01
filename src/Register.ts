import {Neurosity} from "@neurosity/sdk";
import {NeurosityAdapter} from "./neurosity-adapter/NeurosityAdapter";
import {NeurosityDataProcessor} from "./neurosity-adapter/NeurosityDataProcessor";
import {NeurosityDataSource} from "./neurosity-adapter/NeurosityDataSource";
import {ScreenLinkTransmitter} from "./link/ScreenLinkTransmitter";
import {ScreenLinkReceiver} from "./link/ScreenLinkReceiver";
import {Settings} from "./services/Settings";

export class Register {
    private static _neurosityAdapter: NeurosityAdapter;
    private static _neurosityDataSource: NeurosityDataSource;
    private static _dataProcessor: NeurosityDataProcessor;
    private static _screenLink: ScreenLinkTransmitter;
    private static _screenLinkReceiver: ScreenLinkReceiver;
    private static _neurosity: Neurosity;
    private static _settings: Settings;

    public static get neurosity(): Neurosity {
        if (!Register._neurosity) {
            Register._neurosity = new Neurosity({autoSelectDevice: false});
        }
        return Register._neurosity;
    }

    public static get neurosityDataSource(): NeurosityDataSource {
        if (!Register._neurosityDataSource) {
            Register._neurosityDataSource = new NeurosityDataSource(Register.neurosity);
        }
        return Register._neurosityDataSource;
    }

    public static get neurosityAdapter(): NeurosityAdapter {
        if (!Register._neurosityAdapter) {
            Register._neurosityAdapter = new NeurosityAdapter(
                Register.neurosity,
                Register.neurosityDataSource,
                Register.dataProcessor,
                Register.settings,
            );
        }
        return Register._neurosityAdapter;
    }

    public static get dataProcessor(): NeurosityDataProcessor {
        if (!Register._dataProcessor) {
            Register._dataProcessor = new NeurosityDataProcessor(Register.neurosityDataSource);
        }
        return Register._dataProcessor;
    }

    public static get screenLink(): ScreenLinkTransmitter {
        if (!Register._screenLink) {
            Register._screenLink = new ScreenLinkTransmitter(Register.dataProcessor, Register.settings);
        }
        return Register._screenLink;
    }

    public static get screenLinkReceiver(): ScreenLinkReceiver {
        if (!Register._screenLinkReceiver) {
            Register._screenLinkReceiver = new ScreenLinkReceiver();
        }
        return Register._screenLinkReceiver;
    }

    public static get settings(): Settings {
        if (!Register._settings) {
            Register._settings = new Settings();
        }
        return Register._settings;
    }


}