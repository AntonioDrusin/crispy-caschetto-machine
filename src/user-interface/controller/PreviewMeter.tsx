import React from "react";
import {Box} from "@mui/material";
import {
    DataSourceInfos,
    KeysOfNeurosityData,
    NeurosityData
} from "../../neurosity-adapter/OutputDataSource";
import {useDrag} from "react-dnd";
import {Observable} from "rxjs";
import {MultiGraph} from "./Graphs/MultiGraph";

interface PreviewMeterProps {
    dataSource: Observable<NeurosityData>;
    valueId: KeysOfNeurosityData;
    color: string;
}

export function PreviewMeter({dataSource, valueId, color}: PreviewMeterProps) {
    const label = DataSourceInfos[valueId].name;

    const [{opacity}, dragRef] = useDrag(() => ({
        type: "card",
        item: {key: valueId},
        collect: (monitor) => ({
            opacity: monitor.isDragging() ? 0.5 : 1
        })
    }), []);

    return <Box sx={{
                    p: 1,
                    m: 1,
                    color: (theme) => (theme.palette.mode === "dark" ? "grey.300" : "grey.800"),
                    border: "1px solid",
                    borderColor: (theme) =>
                        theme.palette.mode === "dark" ? "grey.800" : "grey.300",
                    backGroundColor: color,
                    borderRadius: 2,
                    fontSize: "0.875rem",
                    fontWeight: "400",
                    display: "flex",
                    flexDirection: "column",
                    flexWrap: "wrap"
                }}
    >
        <Box sx={{color: color, opacity: opacity}} ref={dragRef}>{label}</Box>
        <MultiGraph key={"mg-"+label} valueId={valueId} dataSource={dataSource} color={color} width={120} height={32} minPlot={0}
                    maxPlot={1}></MultiGraph>
    </Box>
}