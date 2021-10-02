import { FileContent } from 'use-file-picker/dist/interfaces';

export interface ImageLabelPairUpdate {
    pair: ImageLabelPair,
    newLabel: string
}

export default interface ImageLabelPair {
    image: FileContent;
    label?: string;
}
