import React from "react";
import ReactDOM from "react-dom";
import * as tf from '@tensorflow/tfjs';
import {loadGraphModel} from '@tensorflow/tfjs-converter';
import "./styles.css";
tf.setBackend('webgl');

const threshold = 0.80;

async function load_model() {
    const model = await loadGraphModel("https://raw.githubusercontent.com/Rana-Banerjee/tfjs_box_detector/main/models/tfjs_model_ckpt8/model.json");
    return model;
  }

let classesDir = {
    1: {
        name: 'box',
        id: 1,
    },
}

class App extends React.Component {
  videoRef = React.createRef();
  canvasRef = React.createRef();


  componentDidMount() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const webCamPromise = navigator.mediaDevices
        .getUserMedia({
          audio: false,
          video: {
            facingMode: "environment"
          }
        })
        .then(stream => {
          window.stream = stream;
          this.videoRef.current.srcObject = stream;
          return new Promise((resolve, reject) => {
            this.videoRef.current.onloadedmetadata = () => {
              resolve();
            };
          });
        });

      const modelPromise = load_model();

      Promise.all([modelPromise, webCamPromise])
        .then(values => {
          this.detectFrame(this.videoRef.current, values[0]);
        })
        .catch(error => {
          console.error(error);
        });
    }
  }

    detectFrame = (video, model) => {
        tf.engine().startScope();
        model.executeAsync(this.process_input(video)).then(predictions => {
        this.renderPredictions(predictions, video);
        requestAnimationFrame(() => {
          this.detectFrame(video, model);
        });
        tf.engine().endScope();
      });
  };

  process_input(video_frame){
    const tfimg = tf.browser.fromPixels(video_frame).resizeNearestNeighbor([512, 512]).toInt();
    const expandedimg = tfimg.transpose([0,1,2]).expandDims();
    return expandedimg;
  };

  buildDetectedObjects(scores, threshold, boxes, classes, classesDir) {
    const detectionObjects = []
    var video_frame = document.getElementById('frame');
    // console.log(scores)
    scores[0].forEach((score, i) => {
      // console.log(score)
      if (score > threshold) {
        // console.log(score)
        const bbox = [];
        const minY = boxes[0][i][0] * video_frame.offsetHeight;
        const minX = boxes[0][i][1] * video_frame.offsetWidth;
        const maxY = boxes[0][i][2] * video_frame.offsetHeight;
        const maxX = boxes[0][i][3] * video_frame.offsetWidth;
        // console.log(video_frame.offsetHeight)
        bbox[0] = minX;
        bbox[1] = minY;
        bbox[2] = maxX - minX;
        bbox[3] = maxY - minY;
        detectionObjects.push({
          class: classes[i],
          label: classesDir[classes[i]].name,
          score: score.toFixed(4),
          bbox: bbox
        })
      }
    })
    return detectionObjects
  }

  renderPredictions = predictions => {
    const ctx = this.canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Font options.
    const font = "16px sans-serif";
    ctx.font = font;
    ctx.textBaseline = "top";

    //Getting predictions

    // console.log(predictions[0].arraySync())
    // console.log(predictions[1].arraySync())
    // console.log(predictions[2].arraySync())
    // console.log(predictions[3].arraySync())
    // console.log(predictions[4].arraySync())
    // console.log(predictions[5].arraySync())
    // console.log(predictions[6].arraySync())
    // console.log(predictions[7].arraySync())
    
    const boxes = predictions[0].arraySync();
    const scores = predictions[2].arraySync();
    const classes = predictions[3].dataSync();
    // console.log(scores)
    const detections = this.buildDetectedObjects(scores, threshold,
                                    boxes, classes, classesDir);

    detections.forEach(item => {
      const x = item['bbox'][0];
      const y = item['bbox'][1];
      const width = item['bbox'][2];
      const height = item['bbox'][3];
      // console.log(item['bbox']);


      // Draw the bounding box.
      ctx.strokeStyle = "#00FFFF";
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, width, height);

      // Draw the label background.
      ctx.fillStyle = "#00FFFF";
      const textWidth = ctx.measureText(item["label"] + " " + (100 * item["score"]).toFixed(2) + "%").width;
      const textHeight = parseInt(font, 10); // base 10
      ctx.fillRect(x, y, textWidth + 4, textHeight + 4);
    });

    detections.forEach(item => {
      const x = item['bbox'][0];
      const y = item['bbox'][1];

      // Draw the text last to ensure it's on top.
      ctx.fillStyle = "#000000";
      ctx.fillText(item["label"] + " " + (100*item["score"]).toFixed(2) + "%", x, y);
    });
  };

  render() {
    return (
      <div>
        <video
          style={{ height:"800px"}}
          className="size"
          autoPlay
          playsInline
          muted
          ref={this.videoRef}
          // width="400"
          // height="900"
          id="frame"
        />
        <canvas
          className="size"
          ref={this.canvasRef}
          width="1200px"
          height="1900px"
        />
      </div>
    );
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
