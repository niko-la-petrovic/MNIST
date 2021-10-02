import { FileContent } from 'use-file-picker/dist/interfaces';
import PredictionState, { initialPredictionState } from '../../shared/interfaces/PredictionState';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import ImageLabelPair, { ImageLabelPairUpdate } from '../../shared/interfaces/ImageLabelPair';
import { Prediction } from '../../../../ApiClients/WebApi/models';
import { ApplicationState } from '../../store';
import { stat } from 'fs';

export interface DrawState {
    value: PredictionState,
    drawData: string,
    status: 'idle' | 'drawing' | 'loading' | 'failed';
}

export const initialState: DrawState = {
    value: {
        ...initialPredictionState,
        imageLabelPairs: [{
            image: {
                content: "",
                lastModified: 0,
                name: ""
            },
            label: ""
        }],
    },
    drawData: "",
    status: 'idle'
};

const equalImages = (im1: FileContent, im2: FileContent) => im1.name === im2.name && im1.lastModified === im2.lastModified;

export const drawSlice = createSlice({
    name: "draw",
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
        setFirstImageLabelPair: (state, action: PayloadAction<ImageLabelPair>) => {
            let pair = action.payload;
            if (!pair)
                return;

            state.value.imageLabelPairs = [pair];
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
        },
        setDrawData: (state, action: PayloadAction<string>) => {
            let payload = action.payload;
            if (!payload)
                return;

            state.drawData = payload;
        },
        clearDrawData: (state, action: PayloadAction<void>) => {
            state.drawData = "";
        },
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
    setFirstImageLabelPair,
    clearDrawData,
    setDrawData,
} = drawSlice.actions;

export const selectImageUpload = (state: ApplicationState) => state.draw.value;
export const selectPrecision = (state: ApplicationState) => state.draw.value.precision;
export const selectMultiDigit = (state: ApplicationState) => state.draw.value.multiDigit;
export const selectImageLabelPairs = (state: ApplicationState) => state.draw.value.imageLabelPairs;
export const selectPredictions = (state: ApplicationState) => state.draw.value.predictions;
export const selectMaxPredictionPairs = (state: ApplicationState) => state.draw.value.maxPredictionPairs;
export const selectDrawData = (state: ApplicationState) => state.draw.drawData;

export default drawSlice.reducer;