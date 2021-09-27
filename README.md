# MNIST
A collection of projects for obtaining the MNIST dataset images, preprocessing, model training, model providing and model consuming.
Primarily developed as a comprehensive example.

## Building

Some of the projects require the following to be built:
- .NET 5.0
- Python 3.x
- TypeScript ^3.8.0
- NodeJs

---

## Motivation for making the project

Most MNSIT examples are not particularly useful in the sense that they don't cover all of the steps mentioned above. Some might conveniently get the data from [tf.data.Dataset](https://www.tensorflow.org/api_docs/python/tf/data/Dataset), some might not show how to consume the model outside of a Python script, etc. - which are important activities.

## Using the code

The solution consists of a few projects.

- MNIST.Console - ML.NET Model Builder way of training the model
![image](https://user-images.githubusercontent.com/23142144/134369007-06e5870c-8835-4f83-a463-dd887bd751bc.png)
- MNIST.IdxToImages - .NET Console app for extracting images from [the original dataset](http://yann.lecun.com/exdb/mnist/)
![image](https://user-images.githubusercontent.com/23142144/134369226-51065ea5-3078-4d35-bc02-31f9b8a8e5c3.png)
- MNIST.ModelTraining - Python 3.8 script that uses tf.keras for training the CNN
![image](https://user-images.githubusercontent.com/23142144/134882234-7dee4430-b6d2-4ec3-9697-cf3f76e10bfe.png)
- MNIST.WebApi - .NET web API project that serves the trained model
![image](https://user-images.githubusercontent.com/23142144/134881973-b770714b-35b9-4ca6-bdfe-80921e2c9b2c.png)
- MNIST.ReactClient - .NET web app that uses NodeJs underneath to serve the React front end app for consuming the trained model from the MNIST.WebApi project
![image](https://user-images.githubusercontent.com/23142144/134881545-e235d1d5-37dc-4438-96ca-43007bf21e1a.png)
![image](https://user-images.githubusercontent.com/23142144/134881818-55361235-9200-479c-b466-96dd5e790768.png)

Use Docker, your IDE or some other way to multi-launch projects together (front end and back end projects simultaneously).
