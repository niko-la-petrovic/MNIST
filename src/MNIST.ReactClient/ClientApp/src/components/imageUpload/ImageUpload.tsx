import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { useFilePicker } from 'use-file-picker';
import { encode } from 'base64-arraybuffer';
import useSubmitPredictionInput from '../../shared/SubmitPredictionInput';
import { Button, InputGroup, FormControl } from 'react-bootstrap';
import { toInteger } from 'lodash';
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { addImages, clearImageLabelPairs, clearPredictions, selectImageLabelPairs, selectMaxPredictionPairs, selectMultiDigit, selectPrecision, selectPredictions, setMaxPredictionPairs, setMultiDigit, setPrecision, setPredictions, updateLabel } from './imageUploadSlice';
import { toast } from 'react-toastify';
import './ImageUpload.css'

function ImageUpload() {

    const [openFileSelector, { filesContent, loading, errors }] = useFilePicker({
        readAs: 'ArrayBuffer',
        accept: 'image/*',
        multiple: true,
        limitFilesConfig: { min: 1, max: 10 },
    });
    const dispatch = useAppDispatch();

    const precision = useAppSelector(selectPrecision);
    const multiDigit = useAppSelector(selectMultiDigit)
    const maxPredictionPairs = useAppSelector(selectMaxPredictionPairs);
    const imageLabelPairs = useAppSelector(selectImageLabelPairs);
    const predictions = useAppSelector(selectPredictions);
    const { submitLabelImagePairs, renderPrediction } = useSubmitPredictionInput(precision, maxPredictionPairs);

    const uploadImages = async () => {
        let toastId: React.ReactText = "";
        try {
            let responsePredictionsPromise = submitLabelImagePairs(imageLabelPairs, multiDigit);
            toast.promise(responsePredictionsPromise, {
                pending: 'Submitting...',
                error: {
                    render({data}){
                        return `${data}`;
                    }
                },
                success: `Success.`
            });
            
            let responsePredictions = await responsePredictionsPromise;
            
            if (responsePredictions) {
                dispatch(setPredictions([...responsePredictions]));
            }
        } catch (error) {
            if (error instanceof Error) {
            }

        }
    }

    const clearAll = () => {
        dispatch(clearImageLabelPairs());
        dispatch(clearPredictions())
    }

    useEffect(() => {
        if (!loading || !errors.length)
            dispatch(addImages(filesContent));
    }, [filesContent]);

    // TODO add drag and drop
    // TODO add ctrl+v image upload
    return (
        <div className="mt-2" style={{ maxWidth: 400 }}>
            <div className="mb-3">
                <Button onClick={() => openFileSelector()} variant="secondary"
                    className="me-3">Select Images</Button>
                <Button onClick={() => uploadImages()} variant="primary"
                    className="me-3">Upload</Button>
                <Button onClick={() => clearAll()} variant="danger"
                    className="me-3">Clear</Button>
            </div>
            <div className="form-check mb-3">
                <input className="form-check-input" type="checkbox"
                    checked={multiDigit} onChange={e => dispatch(setMultiDigit(e.target.checked))}
                    id="multidigit" name="multidigit" />
                <label className="form-check-label" htmlFor="multidigit">
                    Multiple digits
                </label>
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
            <div>
                {imageLabelPairs.map((pair) => {
                    return (
                        <div key={pair.image.name + pair.image.lastModified}>
                            <h3>{pair.image.name}</h3>
                            <InputGroup className="mb-3">
                                <InputGroup.Text>Label</InputGroup.Text>
                                <FormControl
                                    placeholder="Label"
                                    aria-label="Label"
                                    value={pair.label ?? ""}
                                    onChange={e => {
                                        e.preventDefault();
                                        dispatch(updateLabel({ pair: pair, newLabel: e.target.value }));
                                    }} />
                            </InputGroup>
                            <div>
                                <img src={"data:image/"
                                    + pair.image.name.split('.').pop() + ";base64,"
                                    + encode(pair.image.content as any)}></img>
                            </div>
                            <br />
                        </div>
                    );
                })}
            </div>
            <div>
                {predictions.map((prediction) => (
                    renderPrediction(prediction)
                ))}
            </div>
        </div>
    );
}

export default connect()(ImageUpload);