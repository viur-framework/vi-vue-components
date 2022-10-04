# viur-vuevi-wip

## setup
`cd vi-base`

`npm install`

`cd vi`

`npm install`

## run
Switch to vi or vi-base folder and run `npm run dev`

## info
to use google login add your client id tp App.vue file.
DO NOT COMMIT THIS CLIENT ID

###
you need to add this to your main.py
```import os
from viur.core import request
from viur.core.utils import currentRequest

if os.environ['GAE_ENV'] == "localdev":
	"Whitelist vueJs Frontend server"
	request.BrowseHandler.requestValidators = []
	def preprocessRequestHandler(path):
		currentRequest.get().response.headers["Access-Control-Allow-Origin"] = "http://localhost:8081"
		currentRequest.get().response.headers["Access-Control-Allow-Credentials"] = "true"
		return (path)

	conf["viur.requestPreprocessor"] = preprocessRequestHandler```
