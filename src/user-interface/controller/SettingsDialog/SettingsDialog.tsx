import React, {useState} from 'react';
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
} from '@mui/material';
import {OptionInfo} from "../../../visualizers/VisualizerDirectory";
import {Register} from "../../../Register";
import {take} from "rxjs";
import * as _ from "lodash";
import {OptionsLink} from "../../../link/ScreenLink";
import {forEach} from "lodash";

interface Props {
    visualizerKey: string;
    options?: OptionInfo[];
}

const SettingsDialog: React.FC<Props> = ({options, visualizerKey}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedSettings, setSelectedSettings] = useState<Record<string, string>>({});
    const [store] = useState(Register.outputMapStore)

    const handleOpenDialog = () => {
        store.parameterMap$.pipe(
            take(1)
        ).subscribe((maps) => {
            const newSettings = _.reduce(maps[visualizerKey].options, (a: any, b) => {
                a[b.key] = b.value.toString();
                return a;
            }, {});
            setSelectedSettings(newSettings);
        });
        setIsOpen(true);
    };

    const handleCloseDialog = () => {
        const newSettings : OptionsLink[] = [];
        forEach( selectedSettings, (v, k) => {
            newSettings.push({value: parseInt(v), key: k});
        })
        store.setOptions(visualizerKey, newSettings);
        setIsOpen(false);
    };

    const handleSettingChange = (label: string, value: string) => {
        setSelectedSettings({...selectedSettings, [label]: value});
    };

    const handleSave = () => {
        handleCloseDialog();
    };

    return (
        <>
            {(options && <>
                    <Button variant={"outlined"} onClick={handleOpenDialog}>
                        Options
                    </Button>
                    <Dialog open={isOpen} onClose={handleCloseDialog} fullWidth={true} maxWidth={"md"}>
                        <DialogTitle>Options</DialogTitle>
                        <DialogContent>
                            {options.map((setting) => (
                                <Box sx={{p: 2}} key={`${visualizerKey}-${setting.label}-bocs`}>
                                    <FormControl
                                        key={`${visualizerKey}-${setting.label}-formcontrol`}
                                        id={`${visualizerKey}-${setting.label}-formcontrol`}

                                        fullWidth>
                                        <InputLabel
                                            id={`${visualizerKey}-${setting.label}-label`}>{setting.label}</InputLabel>
                                        <Select
                                            key={`${visualizerKey}-${setting.label}-select`}
                                            labelId={`${visualizerKey}-${setting.label}-label`}
                                            id={`${visualizerKey}-${setting.label}-select`}
                                            value={selectedSettings[setting.label] || ''}
                                            label={setting.label}
                                            onChange={(e) => handleSettingChange(setting.label, e.target.value as string)}
                                        >
                                            {setting.options.map((option, index) => (
                                                <MenuItem key={option} value={index.toString()}
                                                          id={`${visualizerKey}-${setting.label}-${options}-item`}>
                                                    {option}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            ))}
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseDialog}>Cancel</Button>
                            <Button onClick={handleSave}>Save</Button>
                        </DialogActions>
                    </Dialog>
                </>
            )}
        </>
    );
};

export default SettingsDialog;