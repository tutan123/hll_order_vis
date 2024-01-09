export default {
    // locate        
    querySearch(queryString, cb) {
        const all_suggestions = this.all_suggestions;
        const results = queryString ? all_suggestions.filter((suggestion) =>
            suggestion.value.toLowerCase().includes(queryString.toLowerCase())
        ) : all_suggestions;

        cb(results);
    },
    locatePosition() {
        if (this.input_history === this.input_bd_name) {
            console.log("重复搜索（不执行）")
            this.repeatFindNotice();
            return;
        }

        this.input_history = this.input_bd_name;

        var isFound = false;

        const inputName = this.input_bd_name;
        const zoomLevel = 16;

        const regex = /^\d+$/;

        console.log("正在搜索:", inputName, "...");

        this.buttonDisabled = true;
        document.getElementById('coordinateInfo').innerHTML = "0 of 0";

        if (regex.test(inputName)) {
            // 是数字 -> BD围栏ID
            const coordinates = this.bdFenceIdToCoordinates[inputName];

            console.log(coordinates);

            if (coordinates) {
                isFound = true;

                // 直接切换
                // map.setView(newCenter, zoomLevel);
                // 平滑切换
                this.map.flyTo(coordinates, zoomLevel, {
                    duration: 5, // Animation duration in seconds
                    easeLinearity: 0.25 // Animation easing, adjust as needed
                });
                this.foundNotice(inputName);

                document.getElementById('coordinateInfo').innerHTML = "1 of 1";
            } else {
                this.notFoundNotice(inputName);
            }
        } else {
            // 非数字 -> 商圈名称
            const coordinatesArray = this.addressToCoordinates[inputName]; // 坐标数组

            if (coordinatesArray && coordinatesArray.length > 0) {
                isFound = true;

                // 直接切换
                // map.setView(newCenter, zoomLevel);
                // 平滑切换
                this.map.flyTo(coordinatesArray[0], zoomLevel, {
                    duration: 5, // Animation duration in seconds
                    easeLinearity: 0.25 // Animation easing, adjust as needed
                });
                this.foundNotice(inputName);

                if (coordinatesArray.length > 1) {
                    this.buttonDisabled = false;
                    this.currentCoordinateIndex = 0;
                    document.getElementById('coordinateInfo').innerHTML = `${this.currentCoordinateIndex + 1} of ${coordinatesArray.length}`;
                } else if (coordinatesArray.length === 1) {
                    document.getElementById('coordinateInfo').innerHTML = "1 of 1";
                }
            } else {
                this.notFoundNotice(inputName);
            }
        }

        console.log("搜索结束, 是否找到:", isFound);
    },
}