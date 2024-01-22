
from . import db
from .model import Alerts
from flask import Blueprint, render_template, request, redirect, url_for


alerts = Blueprint('alerts', __name__)


@alerts.route("/mes", methods=['GET', 'POST'])
def mes():
    if request.method == 'POST':
               
        e = request.form.get('email')

        n = request.form.get('name')
        m = request.form.get('message')
        nm = Alerts(name=n, email=e, alerts=m)
        db.session.add(nm)
        db.session.commit()

        return redirect("/")
    else:
        return render_template(r'main.html')
