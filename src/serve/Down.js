export default class BoardCanvas {
    constructor(container) {
        // 容器
        this.container = container
        // canvas画布
        this.canvas = this.createCanvas(container)
        // 绘制工具
        this.ctx = this.canvas.getContext('2d')
        // 起始点位置
        this.startX = 0
        this.stateY = 0
        // 画布历史栈
        this.pathSegmentHistory = []
        this.index = 0

        // 初始化
        this.init()
    }

    // 创建画布
    createCanvas(container) {
        const canvas = document.createElement('canvas')
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
        canvas.style.display = 'block'
        canvas.style.backgroundColor = 'white'
        container.appendChild(canvas)
        return canvas
    }

    // 初始化
    init() {
        this.addPathSegment()
        this.setContext2DStyle()
        //下面两行，原文件是没有的，如果没有会导致保存的图片没有背景，只有绘画轨迹
        this.ctx.fillStyle = "#ffffff";
        this.ctx.fillRect(0, 0,this.canvas.width, this.canvas.height);
        
        this.canvas.addEventListener('contextmenu', e => e.preventDefault())
        this.canvas.addEventListener('mousedown', this.mousedownEvent.bind(this))
        window.document.addEventListener('keydown', this.keydownEvent.bind(this))
    }

    // 设置画笔样式
    setContext2DStyle() {
        this.ctx.strokeStyle = 'black'
        this.ctx.lineWidth = 3
        this.ctx.lineCap = 'round'
        this.ctx.lineJoin = 'round'
    }

    // 鼠标事件
    mousedownEvent(e) {
        const that = this
        const ctx = this.ctx
        ctx.beginPath()
        ctx.moveTo(e.offsetX, e.offsetY)
        ctx.stroke()

        this.canvas.onmousemove = function (e) {
            ctx.lineTo(e.offsetX, e.offsetY)
            ctx.stroke()
        }
        this.canvas.onmouseup = this.canvas.onmouseout = function () {
            that.addPathSegment()
            this.onmousemove = null
            this.onmouseup = null
            this.onmouseout = null
        }
    }

    // 键盘事件
    keydownEvent(e) {
        if(!e.ctrlKey) return
        switch(e.keyCode) {
            case 90:
                this.undo()
                break
            case 89:
                this.redo()
                break
        }
    }

    // 添加路径片段
    addPathSegment() {
        const data = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
        // 删除当前索引后的路径片段，然后追加一个新的路径片段，更新索引
        this.pathSegmentHistory.splice(this.index + 1)
        this.pathSegmentHistory.push(data)
        this.index = this.pathSegmentHistory.length - 1
    }

    // 撤销
    undo() {
        if(this.index <= 0) return
        this.index--
        this.ctx.putImageData(this.pathSegmentHistory[this.index], 0, 0)
    }
    // 恢复
    redo() {
        if(this.index >= this.pathSegmentHistory.length - 1) return
        this.index++
        this.ctx.putImageData(this.pathSegmentHistory[this.index], 0, 0)
    }
	//获取画布内容
    getImage() {
        return this.canvas.toDataURL();
    }
    //清空画板
    cleanboard(){
        this.ctx.fillStyle = "#ffffff";
        this.ctx.fillRect(0, 0,this.canvas.width, this.canvas.height);
    }
}

