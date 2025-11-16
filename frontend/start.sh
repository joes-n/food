#!/bin/sh
PORT=${PORT:-8080}
exec serve -s dist -l tcp://0.0.0.0:$PORT
