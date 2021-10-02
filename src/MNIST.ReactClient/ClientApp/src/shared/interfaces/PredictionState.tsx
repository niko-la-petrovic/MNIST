import ImageLabelPair from './ImageLabelPair'
import { Prediction } from 'WebApi/models';

export const initialPredictionState: PredictionState =
{
    precision: 2,
    imageLabelPairs: [],
    predictions: [],
    multiDigit: false,
    maxPredictionPairs: 200
};

export default interface PredictionState {
    precision: number,
    imageLabelPairs: ImageLabelPair[],
    predictions: Prediction[],
    multiDigit: boolean,
    maxPredictionPairs : number
};