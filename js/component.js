// import { JsonProvider } from 'leaflet-geosearch';
// console.log(JsonProvider)
// vue
Vue.config.productionTip = false
new Vue({
    el: '#app',
    data: {
        activeButton: '',               // 记录点击了哪个上传按钮
        form: {},
        tableData: [],                  // 存储上传的数据
        market_data: [],
        fence_bd_data: [],
        fence_grid_data: [],
        customZoom: 5,
        fenceMinZoom: 13,
        numMinZoom: 15,
        loading: false,
        input_bd_name: '',
        addressToCoordinates: {},
        bdFenceIdToCoordinates: {},     // BD围栏id-中心坐标的哈希表
        currentCoordinateIndex: 0,
        buttonDisabled: true,
        input_history: undefined,
        all_suggestions: []
    },
    watch: {
        tableData(newValue, oldValue) {
            // 判断旧值的数组是否为空，来防止再次导入数据时重复绘制
            if (oldValue.length == 0 && newValue.length > 0) {
                this.drawGrid();
                this.drawCluster();
            }
        },
        market_data(newValue, oldValue) {
            // 判断旧值的数组是否为空，来防止再次导入数据时重复绘制
            if (oldValue.length == 0 && newValue.length > 0) {
                this.drawGeoFence(); // 蓝色商圈区域
            }
        },
        fence_bd_data(newValue, oldValue) {
            // 判断旧值的数组是否为空，来防止再次导入数据时重复绘制
            if (oldValue.length == 0 && newValue.length > 0) {
                this.drawCluster(); // 红色h3网格聚类边框及名字
            }
        },
        fence_grid_data(newValue, oldValue) {
            // 判断旧值的数组是否为空，来防止再次导入数据时重复绘制
            if (oldValue.length == 0 && newValue.length > 0) {
                this.drawGrid(); // 白色h3网格
            }
        }
    },
    mounted() {
        this.initMap(); // 初始化地图、搜索、上传
    },
    methods: {
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
        initMap() {
            // 设置地图初始参数
            var map = L.map('map', { // L 是leaflet
                center: [31.23, 121.47], // 中点位置
                zoom: 5, // 缩放比例
                layers: [ // 导入地图
                    L.tileLayer('http://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
                        {
                            maxZoom: 30,
                            minZoom: 3,
                            subdomains: "1234",
                            attribution: 'Map data &copy; <a href=" ">高德地图</a >',
                        })
                ]
            });
            this.map = map;
            // var wkts = "MULTIPOLYGON(((106.45505485369294 29.472586876694994,106.45649659042348 29.47189762546174,106.45790308321794 29.470965363157028,106.45588365777475 29.46738383561855,106.45394480512718 29.46336678325218,106.45171872620146 29.458264038860623,106.44626008498334 29.460108791462748,106.4486248602415 29.46668272339483,106.44965078618141 29.46989848146782,106.4499198275915 29.47059986944569,106.45102353675044 29.472024896772794,106.45198221736776 29.472074077112083,106.45243904347383 29.47209368332193,106.45289580419815 29.47208342907515,106.4539531442402 29.472511056657545,106.45454441604015 29.472564843000033,106.45505485369294 29.472586876694994,106.45505485369294 29.472586876694994)))"
            // var geos = Terraformer.wktToGeoJSON(wkts)
            // console.log("wkt转geojson",Terraformer.wktToGeoJSON(wkts))
            // L.geoJSON(geos).addTo(map)
            // this.drawGeoFence()
            this.addSearch();
            // this.drawCluster()
        },
        addSearch() {
            class MyProvider extends GeoSearch.JsonProvider {
                endpoint({ query, type }) {
                    // Result: https://example.com/api/search?q=some%20address&f=json
                    return this.getUrl('https://nominatim.openstreetmap.org/', {
                        q: query,
                        format: 'json',
                    });
                }

                parse({ data }) {
                    // Note that `data` is the raw result returned by the server. This
                    // method should return data in the SearchResult format.
                    return data.map((d) => ({
                        x: +d.lat,
                        y: +d.lon,
                        label: d.display_name,
                        bounds: d.boundingbox,
                    }));
                }
            }

            // this数据赋值
            var map = this.map;
            const search = new GeoSearch.SearchControl({
                provider: new GeoSearch.OpenStreetMapProvider(),
                // provider: new MyProvider(),
                style: 'bar',
                notFoundMessage: '没有匹配数据',
            });

            map.addControl(search);
        },
        async drawGeoFence() { // 1 专业市场-button: 画工作市场-蓝色区域
            //this数据赋值
            const map = this.map;

            this.input_history = undefined;

            // 读取工作市场数据
            const fence_data = this.market_data;

            const labelLayer = L.layerGroup();
            // 绘制围栏和名称

            console.log("正在渲染专业市场...");

            for (const fence of fence_data) {
                var wkts = fence.sys_geom; // 经纬度信息
                var geos = Terraformer.wktToGeoJSON(wkts);
                // 绘制围栏
                var lakeLayer = L.geoJSON(geos).addTo(map)

                // // 围栏名称
                // var content = "<div>" + d.fence_name + "</div>"

                // // marker的icon文字
                // var myIcon = L.divIcon({
                //     html: "<div style='color:red; font-size: 8px;'>" + content + "</div>",
                //     className: 'my-div-icon',
                //     iconSize: 50
                // })

                // //中心点位
                // var textLabel = L.marker(lakeLayer.getBounds().getCenter(), { icon: myIcon })
                // labelLayer.addLayer(textLabel)

                const newCenter = [lakeLayer.getBounds().getCenter().lat, lakeLayer.getBounds().getCenter().lng];
                this.bdFenceIdToCoordinates[fence.id] = newCenter;

                this.all_suggestions.push({ value: String(fence.id) });
            }

            // console.log("BD围栏id-中心哈希表:", this.bdFenceIdToCoordinates);
            this.bdUploadNotice();
            console.log("专业市场渲染完毕");

            // // 监听地图的缩放事件
            // map.on('zoomend', () => {
            //     var currentZoom = map.getZoom(); // 获取当前缩放级别
            //     var fenceMinZoom = this.fenceMinZoom
            //     // 根据缩放级别决定哪些文本标签显示或隐藏
            //     this.$nextTick(() => {
            //         if (currentZoom >= fenceMinZoom) {
            //             map.addLayer(labelLayer)
            //         } else {
            //             map.removeLayer(labelLayer)
            //         }
            //     })
            // });
        },
        async drawCluster() {  // 2 商圈边框-button: 聚类商圈红色边框
            const map = this.map;
            const strokeWidth = 4;                  // Stroke的线宽
            const clusterStrokeColor = "#c92a2a";   // 聚类网格Stroke颜色
            const opacity = 0.8;                    // Stroke透明度
            const cluster_data = this.fence_bd_data; // 读取红色聚类商圈区域边框

            this.input_history = undefined;

            let cnt = 0; // 交付时需要注释掉
            console.log("正在渲染商圈边框...");


            for (const cluster of cluster_data) {
                cnt++;
                const bounding = cluster.bounding;
                const fence_name = cluster.fence_name;

                // 使用 coordtransform 将 WGS 84 转换为高德坐标
                const gcj02Coordinates = bounding.map(coord => (
                    coord.map(d => (
                        d.map(dd => {
                            const result = coordtransform.wgs84togcj02(dd[0], dd[1]);
                            return [result[1], result[0]];
                        })
                    ))
                ))

                const layer = L.polygon(gcj02Coordinates, {
                    color: clusterStrokeColor,
                    weight: strokeWidth,
                    opacity: opacity,
                    fill: false
                }).addTo(map);

                // const content = "<div>" + fence_name + "</div>";

                // if (cnt % 200 === 0) {
                //     console.log("商圈名称:", fence_name, cnt); // 打印围栏名称到控制台
                // }

                const newCenter = [layer.getBounds().getCenter().lat, layer.getBounds().getCenter().lng];

                if (!this.addressToCoordinates[fence_name]) {
                    this.addressToCoordinates[fence_name] = [];
                }
                this.addressToCoordinates[fence_name].push(newCenter);

                this.all_suggestions.push({ value: fence_name });

                // marker的icon文字
                // const myIcon = L.divIcon({
                //     html: "<div style='color:red; font-size: 8px;'>" + content + "</div>",
                //     className: 'my-div-icon',
                //     iconSize: 50
                // });
                // var textLabel = L.marker(layer.getBounds().getCenter(), { icon: myIcon }).addTo(map);
                // var textLabel = L.marker(layer.getBounds().getCenter(), { icon: myIcon });

                // 交付时需要注释掉
                if (cnt === 10000) {
                    throw new Error();
                }
            }

            this.boundingUploadNotice();
            console.log("商圈边框渲染完毕");
        },
        drawGrid() {           // 3 商圈网络-button: 画h3 网格
            /** 全局数据赋值 **/
            const tableData = this.fence_grid_data;
            const map = this.map;
            const _this = this;

            /** 样式配置 **/
            const fillOpacity = 0.5;              // 网格不透明度
            const strokeWidth = 1;                // Stroke的线宽
            const clusterStrokeColor = "#c92a2a"; // 聚类网格Stroke颜色
            const opacity = 0.8;                  // Stroke透明度

            this.input_history = undefined;

            // const colorScale = d3.scaleLinear()
            //     .domain(d3.extent(tableData, d => d.normCount)) // 数据范围
            //     .range(["gray", "red"]); // 颜色范围
            const colors = ["#adb5bd", "#ffe3e3", "#ffc9c9", "#ff8787", "#fa5252", "#c92a2a"];
            const ranges = [5, 8, 10, 15, 20];

            const colorScale = d3.scaleThreshold()
                .domain(ranges) // 数据范围
                .range(colors); // 颜色范围

            const labelLayer = [];
            const clusterLayer = [];

            console.log("正在渲染商圈网格...");

            tableData.forEach(d => {
                const boundary = h3.cellToBoundary(d.h3id); // h3id 转化为网格

                // 使用 coordtransform 将 WGS 84（世界通用） 转换为高德坐标（中国）
                const gcj02Coordinates = boundary.map(coord => {
                    const result = coordtransform.wgs84togcj02(coord[1], coord[0]);
                    return [result[1], result[0]]; // 反转经纬度顺序
                });

                // console.log("gcj02Coordinates", gcj02Coordinates)

                const h3id = d.h3id;
                const count = +d.count;

                // const cluster_flag = +d.cluster_flag
                // console.log("cluster_flag", cluster_flag)
                var layer = L.polygon(gcj02Coordinates, {
                    color: "#ffffff",
                    fillColor: colorScale(count),
                    weight: strokeWidth,
                    opacity: opacity,
                    fillOpacity: fillOpacity
                }).addTo(map);

                // if (cluster_flag == 1) {
                //     clusterLayer.push(layer)
                // }
                // 添加tooltip
                const tooltip = "<div style='color:black;'> h3id: " + h3id + " : " + count + "</div>";
                layer.bindTooltip(tooltip);

                // 添加鼠标悬停事件以关闭tooltip
                layer.on('mouseover', function () {
                    this.openTooltip();
                });

                layer.on('mouseout', function () {
                    this.closeTooltip();
                });

                layer.on('click', function () {
                    _this.copy(h3id);
                });

                // marker的icon文字
                const myIcon = L.divIcon({
                    html: "<div style='color:black;'>" + count + "</div>",
                    className: 'text-icon',
                    iconSize: 10
                });

                //中心点位
                const textLabel = L.marker(layer.getBounds().getCenter(), { icon: myIcon });
                labelLayer.push(textLabel);
            })

            this.combinedUploadNotice();
            console.log("商圈网格渲染完毕");

            // 将聚类网格图层置顶，避免被相邻非聚类网格的stroke覆盖
            clusterLayer.forEach(layer => {
                layer.bringToFront();
            });

            // 监听地图的缩放事件
            // map.on('zoomend', () => {
            //     var currentZoom = map.getZoom(); // 获取当前缩放级别
            //     var minZoom = this.minZoom
            //     // 根据缩放级别决定哪些文本标签显示或隐藏
            //     // this.$nextTick(() => {
            //     //     if (currentZoom >= minZoom) {
            //     //         if (!map.hasLayer(labelLayer))
            //     //             map.addLayer(labelLayer)
            //     //     } else {
            //     //         if (map.hasLayer(labelLayer))
            //     //             map.removeLayer(labelLayer)
            //     //     }
            //     // })


            // });

            // 添加拖拽事件监听器
            map.on('dragend', function () {
                updateGridsInViewport();
            });

            // 添加缩放事件监听器
            map.on('zoomend', function () {
                var currentZoom = map.getZoom();
                _this.currentZoom = currentZoom;

                updateGridsInViewport();
            });

            // 更新视窗内的网格文字（订单数量）
            function updateGridsInViewport() {
                const numMinZoom = _this.numMinZoom;
                const currentZoom = _this.currentZoom;
                if (currentZoom >= numMinZoom) {
                    labelLayer.forEach(textLabel => {
                        if (map.getBounds().contains(textLabel.getLatLng())) {
                            textLabel.addTo(map);
                        }
                    });
                } else {
                    labelLayer.forEach(textLabel => {
                        if (map.hasLayer(textLabel)) {
                            textLabel.remove();
                        }
                    });
                }
            }
        },
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
})