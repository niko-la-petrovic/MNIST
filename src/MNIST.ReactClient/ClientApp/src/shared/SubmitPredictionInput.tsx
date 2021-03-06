import * as React from 'react';
import { PredictionsApiFactory } from "WebApi";
import { Prediction } from 'WebApi/models/prediction';
import ImageLabelPair from '../shared/interfaces/ImageLabelPair';
import ColorScale from "color-scales"
import _ from "lodash";
import { InputGroup, FormControl } from 'react-bootstrap';
import './SubmitPredictionInput.css'

function renderLabel(label: string) {
    if (!label)
        return ('');

    return (
        <InputGroup className="mb-3">
            <InputGroup.Text>Label</InputGroup.Text>
            <FormControl placeholder="Label" value={label}
                readOnly={true} />
        </InputGroup>
    );
}

function renderLabelProbabilityPairs(renderLabelProbabilityPairs: { [key: string]: number },
    precision: number = 2,
    maxPredictionPairs: number = Number.MAX_SAFE_INTEGER) {
    if (!renderLabelProbabilityPairs) {
        return ('');
    }

    let n = Object.entries(renderLabelProbabilityPairs).length;
    let colorScale = new ColorScale(0, n, ["#00BB29", "#CC352D"]);

    return (
        <div>Label Probability Pairs:
            {Object.entries(renderLabelProbabilityPairs)
                .sort((o1, o2) => o2[1] - o1[1])
                .slice(0, maxPredictionPairs)
                .map((labelProbabilityPair, index) => {
                    return (
                        <div style={{ color: colorScale.getColor(index).toHexString() }}
                            key={labelProbabilityPair + index.toString()}>
                            <div>{labelProbabilityPair[0]}: {_.round(labelProbabilityPair[1] * 100, precision)}%</div>
                        </div>
                    )
                })
            }
        </div>
    );
}

function renderLabelScorePairs(renderLabelScorePairs: { [key: string]: number }) {
    if (!renderLabelScorePairs) {
        return ('');
    }

    return (
        <div>
            {Object.entries(renderLabelScorePairs)
                .map((label, score) => (
                    <div key={label + score.toString()}>
                        <div>{label[0]}: {label[1]}</div>
                    </div>
                ))}
        </div>
    );
}

async function submitLabelImagePairs(imageLabelPairs: ImageLabelPair[], multiDigit: boolean = false) {
    let files: File[] = imageLabelPairs.map((pair, index) =>
        new File([pair.image.content as any], pair.image.name, { type: "application/octet-stream" })
    );
    let fileLabels: { [key: string]: string } = {};
    imageLabelPairs.forEach(pair => fileLabels[pair.image.name.split('.')[0]] = pair.label ?? "");

    let response = await PredictionsApiFactory({},
        process.env.REACT_APP_WEBAPI_BASE_URL)
        .apiPredictionsPredictPost(files, fileLabels, multiDigit);

    if (response.status === 200) {
        return [...response.data];
    }
    else
        throw new Error(`Failed to upload image data: ${response.status} ${response.statusText}.`);
}

// TODO show scores?
function useSubmitPredictionInput(precision: number = 2, maxPredictionPairs: number = Number.MAX_SAFE_INTEGER) {
    return {
        submitLabelImagePairs: submitLabelImagePairs,
        renderLabelProbabilityPairs: renderLabelProbabilityPairs,
        renderLabelScorePairs: renderLabelScorePairs,
        renderLabel: renderLabel,
        renderPrediction: (prediction: Prediction) => {
            if (!prediction)
                return ('')

            return (
                <div key={prediction.inputImage}>
                    <p>{prediction.inputImage}</p>
                    {renderLabel(prediction.label)}
                    <div>
                        {renderLabelProbabilityPairs(
                            prediction.labelProbabilityPairs as { [key: string]: number },
                            precision,
                            maxPredictionPairs
                        )}
                    </div>
                    {/* <div>Label Score Pairs:{renderLabelScorePairs(prediction.labelScorePairs as { [key: string]: number })}</div> */}
                </div>
            )
        }
    };
}

export default useSubmitPredictionInput;