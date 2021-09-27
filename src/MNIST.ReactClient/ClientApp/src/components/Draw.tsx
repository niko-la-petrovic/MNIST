import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import CanvasDraw from "react-canvas-draw";
import { decode } from 'base64-arraybuffer';
import { Prediction } from 'WebApi/models/prediction';
import useSubmitPredictionInput from '../shared/SubmitPredictionInput';
import Jimp from 'jimp';
import { toInteger } from 'lodash';
import { Container, Button, ButtonGroup, FormControl, InputGroup } from 'react-bootstrap';
import './Draw.css';

function Draw() {
    const [prediction, setPrediction] = useState<Prediction>({ inputImage: null, label: null, labelProbabilityPairs: null, labelScorePairs: null });
    const canvasDrawRef: any = useRef();
    const [canvasWidth, setCanvasWidth] = useState(400);
    const [canvasHeight, setCanvasHeight] = useState(400);
    const [canvasSquares, setCanvasSquares] = useState(1);
    const [precision, setPrecision] = useState(2);
    const [label, setLabel] = useState("");
    const [multiDigit, setMultiDigit] = useState(false);
    const { submitLabelImagePairs, renderPrediction } = useSubmitPredictionInput(precision);
    const [overlayWidth, setOverlayWidth] = useState(0);
    const [overlayHeight, setOverlayHeight] = useState(0);

    useEffect(() => {
        setOverlayWidth(canvasWidth);
    }, [canvasWidth]);

    useEffect(() => {
        setOverlayHeight(canvasHeight);
    }, [canvasHeight]);

    useEffect(() => {
        setCanvasWidth(400*canvasSquares);
    }, [canvasSquares]);

    const clear = () => {
        canvasDrawRef.current.clear();
        setPrediction({ inputImage: null, label: null, labelProbabilityPairs: null, labelScorePairs: null });
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
                }, label: label
            }
        ], multiDigit);
        if (result != null && result.length > 0) {
            setPrediction(result[0]);
        }
    };

    const renderCanvasSizeAdjust = () => {
        return (
            <div className="d-flex mb-3 justify-content-center align-items-center">
                <ButtonGroup aria-label="Basic example">
                    <Button variant="outline-dark"
                        disabled={canvasSquares <= 1}
                        onClick={e => setCanvasSquares(canvasSquares - 1)}>
                        -1
                    </Button>
                    <Button variant="outline-dark"
                        onClick={e => setCanvasSquares(canvasSquares + 1)}>
                        +1
                    </Button>
                </ButtonGroup>
            </div>
        );
    };

    return (
        <div style={{ maxWidth: 400 }}>
            <div className="mb-3">
                <Button onClick={e => uploadImage()} variant="primary" className="me-3">Upload</Button>
                <Button onClick={e => clear()} variant="danger">Clear</Button>
            </div>
            <div className="form-check mb-3">
                <input className="form-check-input" type="checkbox"
                    checked={multiDigit} onChange={e => setMultiDigit(e.target.checked)}
                    id="multidigit" name="multidigit" />
                <label className="form-check-label" htmlFor="multidigit">
                    Multiple digits
                </label>
            </div>
            <InputGroup className="mb-3">
                <InputGroup.Text id="label-label">Label</InputGroup.Text>
                <FormControl
                    placeholder="Label"
                    aria-label="Label"
                    aria-describedby="label-label"
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                />
            </InputGroup>
            <div>
                {renderCanvasSizeAdjust()}
            </div>
            <div id="canvas-container" className="overlay-container">
                <CanvasDraw ref={canvasDrawRef}
                    backgroundColor="black"
                    brushColor="white"
                    canvasHeight={canvasHeight}
                    canvasWidth={canvasWidth}
                    style={{
                        boxShadow:
                            "0 13px 27px -5px rgba(50, 50, 93, 0.25),    0 8px 16px -8px rgba(0, 0, 0, 0.3)"
                    }}
                />
                <Container className="overlay d-flex justify-content-center align-items-center"
                    style={{ width: overlayWidth, height: overlayHeight }}>

                    <div className="bounding-box"
                        style={{ width: toInteger(overlayWidth * .85), height: toInteger(overlayHeight * .85) }}>
                    </div>

                </Container>
            </div>
            <InputGroup className="my-3">
                <InputGroup.Text id="precision-label">Precision</InputGroup.Text>
                <input type="number"
                    id="precision-input"
                    name="precision-input"
                    aria-describedby="precision-label"
                    className="form-control"
                    value={precision}
                    onChange={e => setPrecision(toInteger(e.target.value))} />
            </InputGroup>
            {renderPrediction(prediction)}
        </div>
    );
}

export default connect()(Draw);