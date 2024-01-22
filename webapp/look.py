from flask import Blueprint, render_template

look = Blueprint('look', __name__)

@look.route("/")
def home():
    return render_template(r'main.html')


@look.route("/dkidform")
def kidney_form():
    return render_template(r'dkid.html')


@look.route("/dlivform")
def liver_form():
    return render_template(r'dliv.html')



@look.route("/dheaform")
def heart_form():
    return render_template(r'dhea.html')



@look.route("/dstroform")
def stroke_form():
    return render_template(r'dstro.html')

@look.route("/ddiaform")
def diabete_form():
    return render_template(r'ddia.html')


@look.route("/dneuform")
def pneumonia_form():
    return render_template(r'dneu.html')