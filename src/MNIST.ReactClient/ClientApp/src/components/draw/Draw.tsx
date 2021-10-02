import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import CanvasDraw from "react-canvas-draw";
import { decode } from 'base64-arraybuffer';
import useSubmitPredictionInput from '../../shared/SubmitPredictionInput';
import Jimp from 'jimp';
import { toInteger } from 'lodash';
import { Container, Button, ButtonGroup, FormControl, InputGroup } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { clearPredictions, selectDrawData, selectImageLabelPairs, selectMaxPredictionPairs, selectMultiDigit, selectPrecision, selectPredictions, setDrawData, setFirstImageLabelPair, setMaxPredictionPairs, setMultiDigit, setPrecision, setPredictions, updateLabel } from '../../components/draw/drawSlice';
import ImageLabelPair from '../../shared/interfaces/ImageLabelPair';
import { toast } from 'react-toastify';
import { useHistory, useLocation } from 'react-router-dom';
import './Draw.css';

function Draw() {
    const dispatch = useAppDispatch();
    const location = useLocation();
    const history = useHistory();

    const precision = useAppSelector(selectPrecision);
    const maxPredictionPairs = useAppSelector(selectMaxPredictionPairs);
    const multiDigit = useAppSelector(selectMultiDigit);
    const imageLabelPairs = useAppSelector(selectImageLabelPairs);
    const predictions = useAppSelector(selectPredictions);
    const drawData = useAppSelector(selectDrawData);

    const canvasDrawRef: any = useRef();
    const [canvasWidth, setCanvasWidth] = useState(400);
    const [canvasHeight, setCanvasHeight] = useState(400);
    const [canvasSquares, setCanvasSquares] = useState(1);
    const [overlayWidth, setOverlayWidth] = useState(0);
    const [overlayHeight, setOverlayHeight] = useState(0);

    const { submitLabelImagePairs, renderPrediction } = useSubmitPredictionInput(precision);

    dispatch(setDrawData(drawData));

    useEffect(() => {
        setOverlayWidth(canvasWidth);
    }, [canvasWidth]);

    useEffect(() => {
        setOverlayHeight(canvasHeight);
    }, [canvasHeight]);

    useEffect(() => {
        setCanvasWidth(400 * canvasSquares);
    }, [canvasSquares]);

    history.block((location, action) => {
        dispatch(setDrawData(canvasDrawRef?.current?.getSaveData()));
    });

    useEffect(() => {
        if (drawData && drawData.length > 0)
            canvasDrawRef?.current?.loadSaveData(drawData);
    }, [drawData]);

    const clear = () => {
        canvasDrawRef.current.clear();
        dispatch(clearPredictions());
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

        let imageLabelPair: ImageLabelPair = {
            image: {
                content: newBuffer as any,
                lastModified: file.lastModified,
                name: file.name
            }, label: imageLabelPairs[0].label
        };
        dispatch(setFirstImageLabelPair(imageLabelPair));

        let resultPromise = submitLabelImagePairs([
            imageLabelPair,
        ], multiDigit);

        toast.promise(resultPromise, {
            pending: 'Submitting...',
            error: {
                render({ data }) {
                    return `${data}`;
                }
            },
            success: `Success.`
        });

        let result = await resultPromise;
        if (result != null && result.length > 0) {
            dispatch(setPredictions(result));
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
        <div className="mt-2" style={{ maxWidth: 400 }}>
            <div className="mb-3">
                <Button onClick={e => uploadImage()} variant="primary" className="me-3">Upload</Button>
                <Button onClick={e => clear()} variant="danger">Clear</Button>
            </div>
            <div className="form-check mb-3">
                <input className="form-check-input" type="checkbox"
                    checked={multiDigit} onChange={e => dispatch(setMultiDigit(e.target.checked))}
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
                    value={imageLabelPairs[0]?.label ?? ""}
                    onChange={e => dispatch(updateLabel({ newLabel: e.target.value, pair: imageLabelPairs[0] }))}
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
                    onChange={e => dispatch(setPrecision(toInteger(e.target.value)))} />
            </InputGroup>
            <InputGroup className="my-3">
                <InputGroup.Text id="max-prediction-pairs-label">Maximum Prediction Pairs</InputGroup.Text>
                <input type="number"
                    id="max-prediction-pairs-input"
                    name="max-prediction-pairs-label"
                    aria-describedby="max-prediction-pairs-label"
                    className="form-control"
                    value={maxPredictionPairs}
                    onChange={e => dispatch(setMaxPredictionPairs(toInteger(e.target.value)))} />
            </InputGroup>
            {renderPrediction(predictions[0])}
        </div>
    );
}

export default connect()(Draw);