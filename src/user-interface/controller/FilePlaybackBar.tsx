import React, {useContext, useEffect, useMemo, useState} from "react";
import {
    Autocomplete,
    Box,
    Button,
    Card,
    Container,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Slider, TextField
} from "@mui/material";
import {PlayArrow, Pause, Eject} from "@mui/icons-material";
import {Register} from "../../Register";
import {FileTag} from "../../neurosity-adapter/FilePlayback";
import {getThemeByName, ThemeContext} from "../../App";

export default function FilePlaybackBar() {
    const [hidden, setHidden] = useState(true);
    const fileReader = useMemo( () => {return Register.neurosityFileReader}, []);
    const [tags, setTags] = useState<FileTag[]>([]);
    const [play, setPlay] = useState<boolean>(false);
    const [position, setPosition] = useState<number>(0);
    const [durationMilliseconds, setDurationMilliseconds] = useState<number>(0);
    const themeContext = useContext(ThemeContext);
    const theme = getThemeByName(themeContext.themeName);

    useEffect(() => {
        const sub = fileReader.active$.subscribe( (started) => {
            setHidden(!started.active);
            setDurationMilliseconds(started.durationMilliseconds);
            if ( started.tags ) {
                setTags([...started.tags]);
            }
        });
        const playSub = fileReader.playStatus$.subscribe( (status) => {
            setPlay(status.play);
            setPosition(status.locationMilliseconds);
        });
        return () => {
            sub.unsubscribe();
            playSub.unsubscribe();
        };
    },[fileReader]);

    const handlePlayPause = () => {
        if ( play ) {
            fileReader.pause();
        }
        else {
            fileReader.play();
        }
    };

    const handleEject = () => {
        fileReader.eject();
    }

    return <Box hidden={hidden}>
        <Container maxWidth="xl">
            <Card sx={{p: 1, m: 1}}>
                <Box sx={{display: "flex", flexDirection: "row", alignItems: "center"}}>
                    <Box sx={{flexShrink: 1, mx: 2}}>
                        <IconButton onClick={handlePlayPause}>
                            { play ? <Pause/> : <PlayArrow/> }
                        </IconButton>
                        <IconButton onClick={handleEject}> <Eject/> </IconButton>
                    </Box>
                    <Box sx={{mx: 2}}>
                        <Autocomplete
                            disablePortal
                            disableCloseOnSelect
                            isOptionEqualToValue={(option, value) => option.index === value.index}
                            id="combo-box-demo"
                            options={tags}
                            sx={{ width: 300 }}
                            renderInput={(params) => <TextField {...params} label="Go To..." />}
                        />
                    </Box>
                    <Box sx={{flexGrow: 1, mx: 2}}>
                        <Slider

                            value={position}
                            min={0}
                            max={durationMilliseconds}
                            size="small"
                            sx={{
                                color: theme.palette.mode === 'dark' ? '#fff' : 'rgba(0,0,0,0.87)',
                                height: 4,
                                '& .MuiSlider-thumb': {
                                    width: 8,
                                    height: 8,
                                    transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
                                    '&:before': {
                                        boxShadow: '0 2px 12px 0 rgba(0,0,0,0.4)',
                                    },
                                    '&:hover, &.Mui-focusVisible': {
                                        boxShadow: `0px 0px 0px 8px ${
                                            theme.palette.mode === 'dark'
                                                ? 'rgb(255 255 255 / 16%)'
                                                : 'rgb(0 0 0 / 16%)'
                                        }`,
                                    },
                                    '&.Mui-active': {
                                        width: 20,
                                        height: 20,
                                    },
                                },
                                '& .MuiSlider-rail': {
                                    opacity: 0.28,
                                },
                            }}/>
                    </Box>
                </Box>

            </Card>
        </Container>
    </Box>
}