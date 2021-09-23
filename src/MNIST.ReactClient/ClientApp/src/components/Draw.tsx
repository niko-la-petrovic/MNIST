import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import CanvasDraw from "react-canvas-draw";
import { decode } from 'base64-arraybuffer';
import { Prediction } from 'WebApi/models/prediction';
import useSubmitPredictionInput from '../shared/SubmitPredictionInput';
import Jimp from 'jimp';
import { toInteger } from 'lodash';
import { Container } from 'react-bootstrap'
import './Draw.css';

function Draw() {
    const [prediction, setPrediction] = useState<Prediction>({ inputImage: null, label: null, labelProbabilityPairs: null, labelScorePairs: null });
    const canvasDrawRef: any = useRef();
    const [precision, setPrecision] = useState(2);
    const { renderLabel, renderLabelProbabilityPairs,
        renderLabelScorePairs, submitLabelImagePairs, renderPrediction } = useSubmitPredictionInput(precision);
    const [overlayWidth, setOverlayWidth] = useState(0);
    const [overlayHeight, setOverlayHeight] = useState(0);
    const [previewImageSource, setPreviewImageSource] = useState<string>("");

    useEffect(() => {
        // console.log(canvasDrawRef)
    });

    useEffect(() => {
        let canvasWidth = canvasDrawRef?.current.canvas.temp.getBoundingClientRect().width ?? 0;
        setOverlayWidth(canvasWidth);
    }, [canvasDrawRef?.style?.width]);

    useEffect(() => {
        let canvasHeight = canvasDrawRef?.current.canvas.temp.getBoundingClientRect().height ?? 0;
        setOverlayHeight(canvasHeight);
    }, [canvasDrawRef?.style?.height]);

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
        let xMid = 0;
        let yMid = 0;
        let n = 0;
        {
            // TODO crop image
            image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
                var red = image.bitmap.data[idx + 0];
                var green = image.bitmap.data[idx + 1];
                var blue = image.bitmap.data[idx + 2];
                if(red === 0 && green === 0 && blue === 0)
                {
                    xMid += x;
                    yMid += y;
                    n++;
                }
            });
            xMid /= n;
            yMid /= n;
        }

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
            <div id="canvas-container" className="overlay-container">
                <CanvasDraw ref={canvasDrawRef}
                    backgroundColor="black"
                    brushColor="white"
                    style={{
                        boxShadow:
                            "0 13px 27px -5px rgba(50, 50, 93, 0.25),    0 8px 16px -8px rgba(0, 0, 0, 0.3)"
                    }}
                />
                <Container className="overlay d-flex justify-content-center align-items-center" style={{ width: overlayWidth, height: overlayHeight }}>
                    <div className="bounding-box" style={{ width: toInteger(overlayWidth * .85), height: toInteger(overlayHeight * .85) }}>
                    </div>
                </Container>
            </div>
            <div>
                Precision
                <input type="number" value={precision}
                    onChange={e => setPrecision(toInteger(e.target.value))} />
            </div>
            <div>
                {renderPrediction(prediction)}
            </div>
            <img src={previewImageSource}></img>
        </div>
    );
}

export default connect()(Draw);