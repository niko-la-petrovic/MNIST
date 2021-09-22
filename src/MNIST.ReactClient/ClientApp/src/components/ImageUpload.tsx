import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { useFilePicker } from 'use-file-picker';
import { FileContent } from 'use-file-picker/dist/interfaces';
import { PredictionsApiFactory } from 'WebApi'
import { Prediction } from 'WebApi/models';
import { encode } from 'base64-arraybuffer';
import ImageLabelPair from '../shared/interfaces/ImageLabelPair';
import useSubmitPredictionInput from '../shared/SubmitPredictionInput';
import './ImageUpload.css'

function ImageUpload() {

    const [openFileSelector, { filesContent, loading, errors, plainFiles, clear }] = useFilePicker({
        readAs: 'ArrayBuffer',
        accept: 'image/*',
        multiple: true,
        limitFilesConfig: { min: 1, max: 10 },
    });
    const { renderLabel, renderLabelProbabilityPairs,
        renderLabelScorePairs, submitLabelImagePairs, renderPrediction } = useSubmitPredictionInput();

    const [imageLabelPairs, setImageLabelPairs] = useState<ImageLabelPair[]>([]);
    const [predictions, setPredictions] = useState<Prediction[]>([]);

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

    const removeFiles = (toRemove: FileContent[]) => {
        toRemove.forEach(tr => {
            let indexToRemove: number = imageLabelPairs.findIndex(i => equalImages(tr, i.image));
            let pairsModified = [...imageLabelPairs];
            if (indexToRemove !== -1)
                pairsModified.splice(indexToRemove, 1);
            setImageLabelPairs(pairsModified);
        });
    }

    const uploadImages = async () => {
        let responsePredictions = await submitLabelImagePairs(imageLabelPairs);
        if(responsePredictions)
            setPredictions([...responsePredictions]);
    }

    const clearAll = () =>{
        setImageLabelPairs([]);
        setPredictions([]);
    }

    useEffect(() => {
        if (!loading || !errors.length)
            addImages(filesContent);
    }, [filesContent]);

    return (
        <div>
            <button onClick={() => openFileSelector()}>Select images</button>
            <button onClick={() => uploadImages()}>Upload images</button>
            <button onClick={() => clearAll()}>Clear</button>
            <br />
            {imageLabelPairs.map((pair, index) => (
                <div key={pair.image.name + pair.image.lastModified}>
                    <h2>{pair.image.name}</h2>
                    <input type="text" value={pair.label}
                        onChange={e => {
                            e.preventDefault();
                            updateLabel(pair, e.target.value);
                        }} />
                    <div>
                        <img src={"data:image/"
                            + pair.image.name.split('.').pop() + ";base64,"
                            + encode(pair.image.content as any)}></img>
                    </div>
                    <br />
                </div>
            ))}
            {predictions.map((prediction, index) => (
                renderPrediction(prediction)
            ))}
        </div>
    );
}

export default connect()(ImageUpload);