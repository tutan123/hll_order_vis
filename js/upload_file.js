export default {
    // upload file
    setActiveButton(buttonId) { // 点击button后记录点击的是哪个按钮
        this.activeButton = buttonId;
    },
    handleBeforeUpload(file) {
        var _this = this;
        // 获取文件名
        const fileName = file.name;
        console.log("已上传:", fileName);
        // 获取文件名的最后一个点的位置
        const lastIndex = fileName.lastIndexOf(".");
        var fileExtension = "";
        if (lastIndex !== -1) {
            fileExtension = fileName.slice(lastIndex + 1).toLowerCase();
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target.result;
            var tableData;

            // 解析数据
            if (fileExtension === "xlsx" || fileExtension === "xls" || fileExtension === "csv") {
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                // 转换表格数据为 JSON 格式
                tableData = XLSX.utils.sheet_to_json(worksheet); // 将数据存储到 tableData
            } else if (fileExtension === "json") {
                tableData = JSON.parse(data); // 将数据存储到 tableData
            }

            // this.tableData = tableData

            // 判断点击了哪个上传按钮，并分别记录
            if (this.activeButton === 'file_market') {
                _this.market_data = tableData;  // 触发watch -> drawGeoFence()
            } else if (this.activeButton === 'flie_fence_bd') {
                _this.fence_bd_data = tableData; // 触发watch -> drawCluster()
            } else if (this.activeButton === 'file_fence_grid') {
                // console.log("file_fence_grid", tableData);
                _this.fence_grid_data = tableData; // 触发watch -> drawGrid()
            }

            // 获取表头
            const tableHeader = Object.keys(tableData[0]).map(key => ({
                name: key,
                key: key
            }))
        }
        reader.readAsBinaryString(file);
        return false;
    },
}