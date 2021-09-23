# -*- coding: utf-8 -*-
"""
Created on Mon Aug 25 22:39:00 2021

@author: Blue-Glass
"""
import os
# os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

import datetime
import logging

import onnx
import tensorflow as tf
import matplotlib.pyplot as plt
import tf2onnx
from keras.callbacks import ModelCheckpoint
from matplotlib import use

logging.basicConfig(format='%(asctime)s %(message)s')
logger = logging.getLogger('mnist')
logger.setLevel(logging.DEBUG)
print(tf.__version__)
tf.get_logger().setLevel('DEBUG')

log_dir = "../logs/fit/" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
tensorboard_callback = tf.keras.callbacks.TensorBoard(log_dir=log_dir, histogram_freq=1)

# checkpoint_callback = ModelCheckpoint(filepath='...hdf5', verbose=1, save_best_only=True)

model_name = "model"
model_save_base_path = '../saved_models'
model_save_path = os.path.join(model_save_base_path, model_name)
model_save_path_hdf5 = os.path.join(model_save_base_path, model_name + ".h5")
model_save_path_json = os.path.join(model_save_base_path, model_name + ".json")
model_save_path_onnx = os.path.join(model_save_base_path, model_name + ".onnx")
data_dir = 'K:/ML/data/mnist'

batch_size = 256
epochs = 50
img_height = 28
img_width = 28
seed = 123
shuffle = True
validation_split = 0.2

random_transforms_layer = tf.keras.Sequential([
    tf.keras.layers.experimental.preprocessing.RandomTranslation(0.05, 0.2, seed=seed)
])


def normalize_img(image, label):
    """Normalizes images: `uint8` -> `float32`."""
    return tf.cast(image, tf.float32) / 255., label


def random_transform_img(image, label):
    return random_transforms_layer(image), label


def preview_img_dataset(dataset, processImage=None, message=None, cmap=None, vmin=0, vmax=255):
    if (processImage is None):
        def processImage(image):
            return image.numpy().astype("uint8")
    plt.figure(figsize=(10, 10))
    for images, labels in dataset.take(1):
        for i in range(9):
            ax = plt.subplot(3, 3, i + 1)
            plt.imshow(processImage(images[i]), cmap=cmap, vmin=vmin, vmax=vmax)
            plt.title(class_names[labels[i]])
            plt.axis("off")
    plt.suptitle(message + "[" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S") + "]")
    plt.show()


ds_train = tf.keras.preprocessing.image_dataset_from_directory(
    directory=data_dir,
    validation_split=validation_split,
    batch_size=batch_size,
    subset='training',
    seed=seed,
    shuffle=shuffle,
    color_mode="grayscale",
    image_size=(img_height, img_width)
)

ds_test = tf.keras.preprocessing.image_dataset_from_directory(
    directory=data_dir,
    validation_split=validation_split,
    batch_size=batch_size,
    subset='validation',
    seed=seed,
    shuffle=shuffle,
    color_mode="grayscale",
    image_size=(img_height, img_width)
)

class_names = ds_train.class_names
logger.info('Classes: ' + str(class_names))

preview_img_dataset(ds_train, message='Before processing', cmap='gray')

AUTOTUNE = tf.data.AUTOTUNE

ds_train = ds_train.map(normalize_img, num_parallel_calls=AUTOTUNE) \
    .map(random_transform_img, num_parallel_calls=AUTOTUNE) \
    .cache() \
    .prefetch(buffer_size=AUTOTUNE)

ds_test = ds_test.map(normalize_img, num_parallel_calls=AUTOTUNE) \
    .map(random_transform_img, num_parallel_calls=AUTOTUNE) \
    .cache() \
    .prefetch(buffer_size=AUTOTUNE)

preview_img_dataset(ds_train,
                    processImage=lambda image: image.numpy().dot(255).astype("uint8"),
                    message='After preprocessing', cmap='gray')

model = tf.keras.models.Sequential([
    tf.keras.layers.Conv2D(filters=64, kernel_size=(9, 9), activation='relu',
                           input_shape=(img_height, img_height, 1), name="input"),
    tf.keras.layers.MaxPooling2D(pool_size=(2, 2)),
    tf.keras.layers.Dropout(0.3),
    tf.keras.layers.Conv2D(filters=128, kernel_size=(3, 3), activation='relu'),
    tf.keras.layers.MaxPooling2D(pool_size=(2, 2)),
    tf.keras.layers.Dropout(0.3),
    tf.keras.layers.Conv2D(filters=256, kernel_size=(3, 3), activation='relu'),
    tf.keras.layers.MaxPooling2D(pool_size=(2, 2)),
    tf.keras.layers.Dropout(0.3),
    tf.keras.layers.Flatten(),
    tf.keras.layers.Dense(units=256, activation='relu'),
    tf.keras.layers.Dense(10),
    # tf.keras.layers.Softmax()
],
    name=model_name
)

model.compile(
    optimizer=tf.keras.optimizers.Adam(0.001),
    loss=tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True),
    metrics=[tf.keras.metrics.SparseCategoricalAccuracy()],
)

model.summary()

logger.info("Starting training.")

# TODO add checkpoint callback to model saving with save_best_only being True
model.fit(
    ds_train,
    use_multiprocessing=True,
    workers=8,
    epochs=epochs,
    validation_data=ds_test,
    callbacks=[tensorboard_callback]
)

logger.info("Finished training.")

model.save(model_save_path)
model.save(model_save_path_hdf5)
json_config = model.to_json()
with open(model_save_path_json, 'w') as f:
    f.write(json_config)
    f.close()

onnx_model, _ = tf2onnx.convert.from_keras(model)
onnx.save(onnx_model, model_save_path_onnx)
