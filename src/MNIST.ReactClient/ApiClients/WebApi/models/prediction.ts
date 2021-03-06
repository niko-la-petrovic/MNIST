/* tslint:disable */
/* eslint-disable */
/**
 * MNIST API
 * MNIST API V1
 *
 * OpenAPI spec version: v1
 * Contact: nikola.petrovic.1999@gmail.com
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */
/**
 * 
 * @export
 * @interface Prediction
 */
export interface Prediction {
    /**
     * 
     * @type {string}
     * @memberof Prediction
     */
    label?: any | null;
    /**
     * 
     * @type {string}
     * @memberof Prediction
     */
    inputImage?: any | null;
    /**
     * 
     * @type {{ [key: string]: number;}}
     * @memberof Prediction
     */
    labelScorePairs?: { [key: string]: number } | null;
    /**
     * 
     * @type {{[key: string]: number;}}
     * @memberof Prediction
     */
    labelProbabilityPairs?: { [key: string]: number } | null;
}
