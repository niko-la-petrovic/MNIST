import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FileContent } from 'use-file-picker/dist/interfaces';
import { Prediction } from 'WebApi/models';
import { ImageLabelPairUpdate } from '../../shared/interfaces/ImageLabelPair';
import PredictionState from '../../shared/interfaces/PredictionState';
import { initialPredictionState } from '../../shared/interfaces/PredictionState';
import { ApplicationState } from '../../store';

export interface ImageUploadState {
    value: PredictionState,
    status: 'idle' | 'loading' | 'failed';
};

export const initialState: ImageUploadState = {
    value: initialPredictionState,
    status: 'idle'
};

const equalImages = (im1: FileContent, im2: FileContent) => im1.name === im2.name && im1.lastModified === im2.lastModified;

export const imageUploadSlice = createSlice({
    name: "imageUpload",
    initialState,
    reducers: {
        setPrecision: (state, action: PayloadAction<number>) => {
            let newPrecision = action.payload;
            if (newPrecision < 1)
                return;

            state.value.precision = action.payload;
        },
        setMultiDigit: (state, action: PayloadAction<boolean>) => {
            let newMultiDigit = action.payload;
            state.value.multiDigit = newMultiDigit;
        },
        clearImageLabelPairs: (state, action: PayloadAction<void>) => {
            state.value.imageLabelPairs = [];
        },
        addImages: (state, action: PayloadAction<FileContent[]>) => {
            let files = action.payload;
            if (files.length === 0)
                return;

            let currentImageLabelPairs = state.value.imageLabelPairs;
            let toAdd = files.filter(fc => !currentImageLabelPairs.find(i => equalImages(i.image, fc)));

            if (toAdd.length === 0)
                return;

            toAdd.forEach(t => currentImageLabelPairs.push({
                image: t,
            }));
        },
        removeImages: (state, action: PayloadAction<FileContent[]>) => {
            let toDelete = action.payload;

            toDelete.forEach(t => {
                let index = state.value.imageLabelPairs.findIndex(i => equalImages(i.image, t));
                if (index !== -1)
                    return;

                state.value.imageLabelPairs.splice(index, 1);
            });
        },
        updateLabel: (state, action: PayloadAction<ImageLabelPairUpdate>) => {
            let update = action.payload;
            let pair = update.pair;
            let newLabel = update.newLabel;
            let imageLabelPairs = state.value.imageLabelPairs;

            let index = imageLabelPairs.findIndex(p => equalImages(p.image, pair.image));
            if (index === -1)
                return;

            imageLabelPairs[index].label = newLabel;
        },
        setPredictions: (state, action: PayloadAction<Prediction[]>) => {
            let predictions = action.payload;
            if (predictions.length === 0)
                return;

            state.value.predictions = predictions;
        },
        clearPredictions: (state, action: PayloadAction<void>) => {
            state.value.predictions = [];
        },
        setMaxPredictionPairs: (state, action: PayloadAction<number>) => {
            let number = action.payload;
            if (number <= 0)
                return;

            state.value.maxPredictionPairs = number;
        }
    },
    extraReducers: {

    },
});

export const {
    setPrecision,
    setMultiDigit,
    addImages,
    clearImageLabelPairs,
    updateLabel,
    removeImages,
    setPredictions,
    clearPredictions,
    setMaxPredictionPairs,
} = imageUploadSlice.actions;

export const selectImageUpload = (state: ApplicationState) => state.imageUpload.value;
export const selectPrecision = (state: ApplicationState) => state.imageUpload.value.precision;
export const selectMultiDigit = (state: ApplicationState) => state.imageUpload.value.multiDigit;
export const selectImageLabelPairs = (state: ApplicationState) => state.imageUpload.value.imageLabelPairs;
export const selectPredictions = (state: ApplicationState) => state.imageUpload.value.predictions;
export const selectMaxPredictionPairs = (state: ApplicationState) => state.imageUpload.value.maxPredictionPairs;

export default imageUploadSlice.reducer;