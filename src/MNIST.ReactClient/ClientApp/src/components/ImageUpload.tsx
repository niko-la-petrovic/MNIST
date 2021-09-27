import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { useFilePicker } from 'use-file-picker';
import { FileContent } from 'use-file-picker/dist/interfaces';
import { Prediction } from 'WebApi/models';
import { encode } from 'base64-arraybuffer';
import ImageLabelPair from '../shared/interfaces/ImageLabelPair';
import useSubmitPredictionInput from '../shared/SubmitPredictionInput';
import { Button, InputGroup, FormControl } from 'react-bootstrap';
import { toInteger } from 'lodash';
import './ImageUpload.css'

function ImageUpload() {

    const [openFileSelector, { filesContent, loading, errors }] = useFilePicker({
        readAs: 'ArrayBuffer',
        accept: 'image/*',
        multiple: true,
        limitFilesConfig: { min: 1, max: 10 },
    });
    // TODO extract precision and multiDigit to separate components
    const [precision, setPrecision] = useState(2);
    const { submitLabelImagePairs, renderPrediction } = useSubmitPredictionInput(precision);
    const [imageLabelPairs, setImageLabelPairs] = useState<ImageLabelPair[]>([]);
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [multiDigit, setMultiDigit] = useState(false);        

    const equalImages = (im1: FileContent, im2: FileContent) => im1.name === im2.name && im1.lastModified === im2.lastModified;

    const addImages = (toAdd: FileContent[]) => {
        let copy = [...imageLabelPairs];
        toAdd.forEach(fc => {
            if (!imageLabelPairs.find(i => equalImages(fc, i.image))) {
                copy = [...copy, { image: fc }];
                setImageLabelPairs(copy);
            }
        });
    }

    const updateLabel = (pair: ImageLabelPair, newLabel: string) => {
        let index = imageLabelPairs.findIndex(p => equalImages(p.image, pair.image));
        if (index !== -1) {
            let copy = [...imageLabelPairs];
            copy[index].label = newLabel;
            setImageLabelPairs(copy);
        }
    }


    const uploadImages = async () => {
        let responsePredictions = await submitLabelImagePairs(imageLabelPairs, multiDigit);
        if (responsePredictions)
            setPredictions([...responsePredictions]);
    }

    const clearAll = () => {
        setImageLabelPairs([]);
        setPredictions([]);
    }

    useEffect(() => {
        if (!loading || !errors.length)
            addImages(filesContent);
    }, [filesContent]);

    // TODO add drag and drop
    // TODO add ctrl+v image upload
    // TODO multi image
    return (
        <div style={{ maxWidth: 400 }}>
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
                    checked={multiDigit} onChange={e => setMultiDigit(e.target.checked)}
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
                    onChange={e => setPrecision(toInteger(e.target.value))} />
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
                                    value={pair.label}
                                    onChange={e => {
                                        e.preventDefault();
                                        updateLabel(pair, e.target.value);
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