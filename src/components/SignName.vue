<template>
  <div class="canvas">
    <div class="canvas_header">手写签名</div>
    <div class="canvas_canvas">
      <canvas id="myCanvas" width="370" height="400"></canvas>
    </div>
    <div class="canvas_info">
      <span @click="showColorDiv()">*请在输入框写入您的姓名</span>
    </div>
    <div class="canvas_footer">
      <div @click="clearArea()" class="canvas_footer_re">重写</div>
      <div @click="saveImage()" class="canvas_footer_sa">保存</div>
      <div @click="saveImageInfo()" class="canvas_footer_su">提交</div>
    </div>
    <!-- 颜色选择器 -->
    <div class="canvas_color" v-show="showColor == 2">
      <div>
        <input v-model="strokeStyle" type="color" />
      </div>
    </div>
  </div>
</template>
<script>
// import zionMdapi from "zion-mdapi";
import mdapi from "../zion_config/request_outer.js";

export default {
  props: ["globalData", "signId", "url", "actionflow_id"],
  data() {
    return {
      // mdapi: null,
      touchPressed: false,
      ctx: null,
      strokeStyle: "#000000", //书写颜色
      lineWidth: 4, //线条宽度
      lastX: null,
      lastY: null,
      canvas: null,
      showColor: 1, //显示颜色
      sColor: 0, //显示颜色
    };
  },
  mounted() {
   
    if (this.$props.url && this.$props.actionflow_id) {
      mdapi.storeConfig_init(this.$props.url, this.$props.actionflow_id);
    } else {
      throw "未传url和actionflow_id参数";
    }

    this.$nextTick(() => {
      let canvas = document.getElementById("myCanvas");
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.Init();
    });
  },
  methods: {
    // 保存服务器
    saveImageInfo() {
      let b = this.canvas.toDataURL();
      mdapi.local_umedia(b).then((imageRes) => {
        if (imageRes.id) {
          this.insertSignPictureOne(imageRes.id).then((res) => {
            if (res.id) {
              this.$props.globalData.sign_image_id = imageRes.id;
            }
          });
        }
      });
    },

    insertSignPictureOne(signImageId) {
      let params = {
        operation: "insert_sign_picture_one",
        object: {
          pic_url_id: signImageId,
          pic_id: signImageId,
        },
        isloading: false,
        field_string: `id pic_id pic_url{id url} `,
      };
      return mdapi.mutation(params);
    },

    Init() {
      // 移动前
      this.canvas.addEventListener(
        "touchstart",
        (event) => {
          if (event.targetTouches.length == 1) {
            event.preventDefault(); // 阻止浏览器默认事件，重要
            var touch = event.targetTouches[0];
            this.touchPressed = true;
            this.draw(
              touch.pageX - this.canvas.offsetLeft,
              touch.pageY - this.canvas.offsetTop,
              false
            );
          }
        },
        false
      );
      // 移动中
      this.canvas.addEventListener(
        "touchmove",
        (event) => {
          if (event.targetTouches.length == 1) {
            event.preventDefault(); // 阻止浏览器默认事件，重要
            var touch = event.targetTouches[0];
            if (this.touchPressed) {
              this.draw(
                touch.pageX - this.canvas.offsetLeft,
                touch.pageY - this.canvas.offsetTop,
                true
              );
            }
          }
        },
        false
      );
      // 移动结束
      this.canvas.addEventListener(
        "touchend",
        (event) => {
          if (event.targetTouches.length == 1) {
            event.preventDefault(); // 阻止浏览器默认事件，防止手写的时候拖动屏幕，重要
            this.touchPressed = false;
          }
        },
        false
      );
    },
    draw(x, y, isDown) {
      let ctx = this.ctx;
      if (isDown) {
        ctx.beginPath();
        ctx.strokeStyle = this.strokeStyle;
        ctx.lineWidth = this.lineWidth;
        ctx.lineJoin = "round";
        ctx.moveTo(this.lastX, this.lastY);
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.stroke();
      }
      this.lastX = x;
      this.lastY = y;
    },
    // 重写
    clearArea() {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    },
    // 保存本地
    saveImage() {
      let a = document.createElement("a");
      a.href = this.canvas.toDataURL();
      a.download = "sign";
      a.click(); //保存
    },

    // 弹出颜色
    showColorDiv() {
      return;
      this.sColor += 1;
      if (this.sColor == 10) {
        this.showColor = 2;
      }
    },
    //签完名的图片旋转处理
    // src为你、base64编码；edg为角度，0-360；callback回调
    rotateBase64Img(src, edg, callback) {
      var canvas = document.createElement("canvas");
      var ctx = canvas.getContext("2d");
      var imgW; //图片宽度
      var imgH; //图片高度
      var size; //canvas初始大小
      if (edg % 90 != 0) {
        console.error("旋转角度必须是90的倍数!");
        throw "旋转角度必须是90的倍数!";
      }
      edg < 0 && (edg = (edg % 360) + 360);
      const quadrant = (edg / 90) % 4; //旋转象限
      const cutCoor = { sx: 0, sy: 0, ex: 0, ey: 0 }; //裁剪坐标
      var image = new Image();
      image.crossOrigin = "anonymous";
      image.src = src;
      image.onload = function () {
        imgW = image.width;
        imgH = image.height;
        size = imgW > imgH ? imgW : imgH;
        canvas.width = size * 2;
        canvas.height = size * 2;
        switch (quadrant) {
          case 0:
            cutCoor.sx = size;
            cutCoor.sy = size;
            cutCoor.ex = size + imgW;
            cutCoor.ey = size + imgH;
            break;
          case 1:
            cutCoor.sx = size - imgH;
            cutCoor.sy = size;
            cutCoor.ex = size;
            cutCoor.ey = size + imgW;
            break;
          case 2:
            cutCoor.sx = size - imgW;
            cutCoor.sy = size - imgH;
            cutCoor.ex = size;
            cutCoor.ey = size;
            break;
          case 3:
            cutCoor.sx = size;
            cutCoor.sy = size - imgW;
            cutCoor.ex = size + imgH;
            cutCoor.ey = size + imgW;
            break;
        }
        ctx.translate(size, size);
        ctx.rotate((edg * Math.PI) / 180);
        ctx.drawImage(image, 0, 0);
        var imgData = ctx.getImageData(
          cutCoor.sx,
          cutCoor.sy,
          cutCoor.ex,
          cutCoor.ey
        );
        if (quadrant % 2 == 0) {
          canvas.width = imgW;
          canvas.height = imgH;
        } else {
          canvas.width = imgH;
          canvas.height = imgW;
        }
        ctx.putImageData(imgData, 0, 0);
        callback(canvas.toDataURL());
      };
    },
    //end
  },
  watch: {
    strokeStyle(newColor, oldColor) {
    },
  },
};
</script>
<style>
.canvas_header {
  width: 100%;
  text-align: center;
  line-height: 50px;
  font-weight: 800;
  font-size: 20px;
}
.canvas_canvas {
  width: 370px;
  margin: 0 auto;
  border: 1px solid #aaa;
}
.canvas_info {
  margin: 10px 8%;
  font-size: 12px;
}
.canvas_footer {
  width: 80%;
  margin: 10px 10%;
  display: flex;
  justify-content: space-between;
  line-height: 40px;
  text-align: center;
  color: white;
  font-weight: 800;
  padding-bottom: 20px;
}
.canvas_footer_re {
  width: 100px;
  background: #f11919;
  border-radius: 10px;
}
.canvas_footer_sa {
  width: 100px;
  background: #1989f1;
  border-radius: 10px;
}
.canvas_footer_su {
  width: 100px;
  background: #2dcb7a;
  border-radius: 10px;
}
</style>
