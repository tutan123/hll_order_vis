export default {
    // locate        
    addMarker() {
        const map = this.map;

        const zoomLevel = 16;
        const coordinates = [this.input_lng, this.input_lat];

        // const test_lng = 38.49868956390724;
        // const test_lat = 106.32873832500779;
        // const coordinates = [test_lng, test_lat];

        map.flyTo(coordinates, zoomLevel, {
            duration: 5, // Animation duration in seconds
            easeLinearity: 0.25 // Animation easing, adjust as needed
        });

        var marker = L.marker(coordinates) // 使用您想要的坐标
            .addTo(map)
            .on('dblclick', function (e) {
                map.removeLayer(marker); // 双击时删除图钉
            });
    }
}