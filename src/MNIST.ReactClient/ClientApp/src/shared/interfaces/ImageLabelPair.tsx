import { FileContent } from 'use-file-picker/dist/interfaces';

export default interface ImageLabelPair {
    image: FileContent;
    label?: string;
}
