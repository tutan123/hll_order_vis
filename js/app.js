// import { JsonProvider } from 'leaflet-geosearch';
// console.log(JsonProvider)
// vue

import map_methods from "./map_methods.js";
import upload_file from "./upload_file.js";
import locate_position from "./locate_position.js";
import utilites from "./utilites.js";

const methods = {
    ...map_methods,
    ...upload_file,
    ...locate_position,
    ...utilites
}

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
    methods
})