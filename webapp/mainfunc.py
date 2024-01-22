import pickle, os, random
from sklearn.preprocessing import StandardScaler
import numpy as np
import os
import xgboost
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import load_img
from werkzeug.utils import secure_filename
import numpy as np




def load(path):
    m = load_model(path, compile=False)
    return m

def predicts(path):
    d = load_img(path, target_size=(224, 224, 3))
    d = np.asarray(d).reshape((-1, 224, 224, 3))
    d = d * 1.0 / 255
    p = np.round(load('./webapp/predictionmod/dneu_finder.h5').predict(d)[0])[0]
    return p

def result(model):
    if len(model) == 15:
        name = 'Kidney'
        with open('./webapp/predictionmod/dkid_finder.pkl', 'rb') as f:
            dkidmod = pickle.load(f)
        predicts = dkidmod.predict(np.array(model).reshape(-1, len(model)))
    elif len(model) == 10:
        name = 'Liver'
        with open('./webapp/predictionmod/dliv_finder.pkl', 'rb') as f:
            dlivmod = pickle.load(f)
        predicts = dlivmod.predict(np.array(model).reshape(-1, len(model)))
    elif len(model) == 11:
        name = 'Heart'
        with open('./webapp/predictionmod/dhea_finder.pkl', 'rb') as f:
            dheamod = pickle.load(f)
        predicts = dheamod.predict(np.array(model).reshape(-1, len(model)))
    elif len(model) == 9:
        name = 'Stroke'
        with open('./webapp/predictionmod/dstro_scalemod.pkl', 'rb') as f:
            dstroscaler = pickle.load(f)
        l2 = dstroscaler.transform(np.array(model[0:2]).reshape((-1, 2))).tolist()[0]
        l1 = np.array(model[2:]).reshape((-1, len(model[2:]))).tolist()[0]
        
        l = l2 + l1
        with open('./webapp/predictionmod/dstro_finder.pkl', 'rb') as f:
            dstromod = pickle.load(f)
        predicts = dstromod.predict(np.array(l).reshape(-1, len(l)))
    elif len(model) == 8:
        name = 'Diabetes'
        with open('./webapp/predictionmod/ddia_finder.pkl', 'rb') as f:
            ddiam = pickle.load(f)
        predicts = ddiam.predict(np.array(model).reshape((-1, 8)))
        print(predicts[0], name)
    return predicts[0], name
