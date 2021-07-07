# tfjs_box_detector
Tensorflow js model to dtect boxes running on client side (webapp)

#Steps to Execute
1. Install the following:
a) npm install http-server -g
b) From the base folder(The one contatining package.json) run the following command to install the necessary node packages: 
npm install
2. Run the model server with the following command from inside the models/tfjs_model_ckpt8 folder:
http-server --port 8082 -c1 --cors .
3. Run the following command from the base folder:
4. npm start
5. A browser will open/ Else open a browser with path as http://localhost:3000 on which the box detector would run
