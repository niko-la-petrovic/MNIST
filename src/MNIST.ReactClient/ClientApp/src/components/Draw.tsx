import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import CanvasDraw from "react-canvas-draw";
import { decode } from 'base64-arraybuffer';
import { Prediction } from 'WebApi/models/prediction';
import useSubmitPredictionInput from '../shared/SubmitPredictionInput';
import Jimp from 'jimp';
import { toInteger } from 'lodash';

function Draw() {
    const [prediction, setPrediction] = useState<Prediction>({ inputImage: null, label: null, labelProbabilityPairs: null, labelScorePairs: null });
    const canvasDrawRef: any = useRef();
    const [precision, setPrecision] = useState(2);
    const { renderLabel, renderLabelProbabilityPairs,
        renderLabelScorePairs, submitLabelImagePairs, renderPrediction } = useSubmitPredictionInput(precision);

    useEffect(() => {
    });

    const clearCanvas = () => {
        canvasDrawRef.current.clear();
    };

    const uploadImage = async () => {
        let dataUrl: string = canvasDrawRef.current.canvas.drawing.toDataURL();
        let arrayBuffer: ArrayBuffer = decode(dataUrl.split(';base64,')[1]);
        let extension = dataUrl.split(';')[0].split('/')[1];
        let file: File = new File([arrayBuffer],
            "drawing." + extension);

        let image = await Jimp.read(arrayBuffer as any);
        let blackBackground = await new Jimp(image.getWidth(), image.getHeight(), "#000000");
        let newBuffer = await blackBackground
            .composite(image, 0, 0)
            .getBufferAsync("image/" + extension);
        let result = await submitLabelImagePairs([
            {
                image: {
                    content: newBuffer as any,
                    lastModified: file.lastModified,
                    name: file.name
                }
            }
        ]);
        if (result != null && result.length > 0) {
            setPrediction(result[0]);
        }
    };

    return (
        <div>
            <button onClick={e => uploadImage()}>Upload</button>
            <button onClick={e => clearCanvas()}>Clear</button>
            <CanvasDraw ref={canvasDrawRef}
                backgroundColor="black"
                brushColor="white"
                style={{
                    boxShadow:
                        "0 13px 27px -5px rgba(50, 50, 93, 0.25),    0 8px 16px -8px rgba(0, 0, 0, 0.3)"
                }}
            />
            <div>
                Precision
                <input type="number" value={precision}
                    onChange={e => setPrecision(toInteger(e.target.value))} />
            </div>
            <div>
                {renderPrediction(prediction)}
            </div>
        </div>
    );
}

export default connect()(Draw);