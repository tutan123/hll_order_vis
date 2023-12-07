export default {
    // notice and message
    notFoundMsg() {
        this.$message.error('未找到');
    },
    foundMsg() {
        this.$message({
            message: '已找到',
            type: 'success'
        });
    },
    repeatFindMsg() {
        this.$message({
            message: '重复搜索（不执行）',
            type: 'warning'
        });
    },
    notFoundNotice(input) {
        this.$notify.error({
            title: `“${input}”不存在`,
            position: 'bottom-right',
            type: 'success',
            showClose: false
        });
    },
    repeatFindNotice() {
        this.$notify({
            title: '重复搜索（不执行）',
            position: 'bottom-right',
            type: 'warning',
            showClose: false
        });
    },
    foundNotice(input) {
        this.$notify({
            title: `已找到“${input}”`,
            position: 'bottom-right',
            type: 'success',
            showClose: false
        });
    },
    bdUploadNotice() {
        this.$notify({
            title: '专业市场渲染完成',
            position: 'bottom-right',
            type: 'success',
            showClose: false
        });
    },
    boundingUploadNotice() {
        this.$notify({
            title: '商圈边框渲染完成',
            position: 'bottom-right',
            type: 'success',
            showClose: false
        });
    },
    combinedUploadNotice() {
        this.$notify({
            title: 'H3网格渲染完成',
            position: 'bottom-right',
            type: 'success',
            showClose: false
        });
    },

    // utilities
    switchCoordinate(direction) {
        const addressToCoordinates = this.addressToCoordinates;
        const zoomLevel = 16;
        const coordinatesArray = addressToCoordinates[this.input_bd_name];

        if (coordinatesArray && coordinatesArray.length > 0) {
            if (direction === 'prev') {
                this.currentCoordinateIndex = (this.currentCoordinateIndex - 1 + coordinatesArray.length) % coordinatesArray.length;
            } else if (direction === 'next') {
                this.currentCoordinateIndex = (this.currentCoordinateIndex + 1) % coordinatesArray.length;
            }
        }

        const totalCoordinates = coordinatesArray.length;

        document.getElementById('coordinateInfo').innerHTML = `${this.currentCoordinateIndex + 1} of ${totalCoordinates}`;

        this.map.flyTo(coordinatesArray[this.currentCoordinateIndex], zoomLevel, {
            duration: 5, // Animation duration in seconds
            easeLinearity: 0.25 // Animation easing, adjust as needed
        });
    },
    copy(value) {
        let transfer = document.createElement('input');
        document.body.appendChild(transfer);
        transfer.value = value;  // 这里表示想要复制的内容
        transfer.focus();
        transfer.select();
        if (document.execCommand('copy')) {
            document.execCommand('copy');
        }
        transfer.blur();
        this.$message({
            message: '网格id复制成功 (' + value + ')',
            type: 'success'
        });
        document.body.removeChild(transfer);
    },
    normalize(value, min, max) {
        return (value - min) / (max - min);
    },
}