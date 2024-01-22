from .mainfunc import predicts,result

from flask import Blueprint, render_template, request, send_from_directory
from werkzeug.utils import secure_filename
import os


pred = Blueprint('pred', __name__)
sf = 'static'
uf = 'uploads'


dp = os.path.dirname(os.path.realpath(__file__))



@pred.route('/putinmodel', methods=["POST", 'GET'])
def putinmodel():

    if request.method == "POST":
        model = request.form.to_dict()
        model = list(model.values())
        model = list(map(float, model))
        dk, page = result(model) 
        return render_template("output.html", pred=dk, page=page)
    else:
        return render_template( 'main.html')

@pred.route('/inputfile', methods=['POST','GET'])
def inputfile():
    print("entered")
    if request.method=="GET":
        return render_template('dneu.html', title='Pneumonia Disease')
    else:
        '''/* f = request.files["file"]
        bp = os.path.dirname(__file__)
        fp = os.path.join(bp,'uploads',  secure_filename(f.filename))
        f.save(fp)
        ind = {0: 'Normal', 1: 'Pneumonia'}
        dk = predicts(fp)

        if dk>0.5:
            accuracy = dk * 100

            label = ind[1]
        else:
            accuracy = 100 - dk
            label = ind[0]*/
	    '''

        file = request.files["file"]
        basepath = os.path.dirname(__file__)
        file_path = os.path.join(basepath,'uploads', secure_filename(file.filename))
        file.save(file_path)
        indices = {0: 'Normal and negative', 1: 'Pneumonia positive'}
        result = predicts(file_path)

        if result>0.5:
            label = indices[1]
            accuracy = result * 100
        else:
            label = indices[0]
            accuracy = 100 - result
        return render_template('makepred.html', image_file_name=file.filename, label = label, accuracy = accuracy)


@pred.route('/uploads/<filename>')
def outfile(filename):
    return send_from_directory(uf, filename)