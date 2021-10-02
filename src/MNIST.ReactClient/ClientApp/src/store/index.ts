import { ImageUploadState } from '../components/imageUpload/imageUploadSlice';
import imageUploadReducer from '../components/imageUpload/imageUploadSlice';
import drawReducer, { DrawState } from '../components/draw/drawSlice';

// The top-level state object
export interface ApplicationState {
    imageUpload: ImageUploadState,
    draw: DrawState
}

// Whenever an action is dispatched, Redux will update each top-level application state property using
// the reducer with the matching name. It's important that the names match exactly, and that the reducer
// acts on the corresponding ApplicationState property type.
export const reducers =
{
    imageUpload: imageUploadReducer,
    draw: drawReducer
};

// This type can be used as a hint on action creators so that its 'dispatch' and 'getState' params are
// correctly typed to match your store.
export interface AppThunkAction<TAction> {
    (dispatch: (action: TAction) => void, getState: () => ApplicationState): void;
}
