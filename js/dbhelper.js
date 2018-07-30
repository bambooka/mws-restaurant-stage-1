const dbName = 'restaurantDB';
const currentVersion = 1;
const currentStore = 'restaurantStore';

/*
 * Open database
 */
const dbPromise = idb.open(dbName, currentVersion, upgradeDB => {
    // Note: we don't use 'break' in this switch statement,
    // the fall-through behaviour is what we want.
    // See https://github.com/jakearchibald/idb
    // noinspection FallThroughInSwitchStatementJS
    switch (upgradeDB.oldVersion) {
        case 0:
            upgradeDB.createObjectStore('restaurantStore', {keyPath: 'id'});
        case 1:
        // TODO: upgrade from v.1 to v.2 if needed;
    }
});

/**
 * Common database helper functions.
 */
class DBHelper {

    /**
     * Database URL.
     */
    static get DATABASE_URL() {
        const port = 1337;
        const domain = 'localhost';
        return `http://${domain}:${port}/restaurants`;
    }

    /**
     * Fetch all restaurants.
     */
    static fetchRestaurants(callback, id) {
        // TODO: would it be better to make the DB calls synchronously instead?
        // First try to fetch restaurants from the database
        dbPromise.then(db => {
            db.transaction(currentStore).objectStore(currentStore)
                .getAll().then(restaurants => {

                if (restaurants.length > 0) {
                    callback(null, restaurants);
                    return;
                }

                // In case of an empty DB, fetch restaurants from the network
                console.log('db is empty');
                DBHelper.fetchRestaurantsFromNetwork((error, restaurants) => {
                    if (restaurants != null) {
                        DBHelper.storeRestaurantsInDatabase(restaurants)
                    }
                    callback(error, restaurants);
                });
            });
        }).catch(reason => {
            callback(`db failed. ${reason}`, null);
        });
    }

    /*
     * Fetch restaurants from the network, if the database is empty
     */
    static fetchRestaurantsFromNetwork(callback) {
        let fetchURL = DBHelper.DATABASE_URL;
        fetch(fetchURL, {method: 'GET'}).then(response => {
            response.json().then(restaurants => {
                callback(null, restaurants);
            });
        }).catch(error => {
            callback(`network request failed. returned ${error}`, null);
        });
    }

    /*
     * Store restaurants into the database
     */
    static storeRestaurantsInDatabase(restaurants) {
        console.log('store restaurants in the db');
        dbPromise.then(db => {
            const tx = db.transaction(currentStore, 'readwrite');
            restaurants.forEach(restaurant => {
                tx.objectStore(currentStore).put(restaurant);
            });
        });
    }

    /**
     * Fetch a restaurant by its ID.
     */
    static fetchRestaurantById(id, callback) {
        // fetch all restaurants with proper error handling.
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                const restaurant = restaurants.find(r => r.id == id);
                if (restaurant) { // Got the restaurant
                    callback(null, restaurant);
                } else { // Restaurant does not exist in the database
                    callback('Restaurant does not exist', null);
                }
            }
        });
    }

    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */
    static fetchRestaurantByCuisine(cuisine, callback) {
        // Fetch all restaurants  with proper error handling
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given cuisine type
                const results = restaurants.filter(r => r.cuisine_type == cuisine);
                callback(null, results);
            }
        });
    }

    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */
    static fetchRestaurantByNeighborhood(neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given neighborhood
                const results = restaurants.filter(r => r.neighborhood == neighborhood);
                callback(null, results);
            }
        });
    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */
    static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                let results = restaurants;
                if (cuisine != 'all') { // filter by cuisine
                    results = results.filter(r => r.cuisine_type == cuisine);
                }
                if (neighborhood != 'all') { // filter by neighborhood
                    results = results.filter(r => r.neighborhood == neighborhood);
                }
                callback(null, results);
            }
        });
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     */
    static fetchNeighborhoods(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all neighborhoods from all restaurants
                const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
                // Remove duplicates from neighborhoods
                const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
                callback(null, uniqueNeighborhoods);
            }
        });
    }

    /**
     * Fetch all cuisines with proper error handling.
     */
    static fetchCuisines(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all cuisines from all restaurants
                const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
                // Remove duplicates from cuisines
                const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
                callback(null, uniqueCuisines);
            }
        });
    }

    /**
     * Restaurant page URL.
     */
    static urlForRestaurant(restaurant) {
        return (`./restaurant.html?id=${restaurant.id}`);
    }

    /**
     * Restaurant image URL.
     */
    static imageUrlForRestaurant(restaurant) {
        return (`/img/${restaurant.photograph}`);
    }

    static imageSrcSetForRestaurant(restaurant) {
        return ('/img/small' + restaurant.photograph);
    }

    static imageAltForRestaurant(restaurant) {
        return (restaurant.alt);
    }

    /**
     * Map marker for a restaurant.
     */
    static mapMarkerForRestaurant(restaurant, map) {
        const marker = new google.maps.Marker({
                position: restaurant.latlng,
                title: restaurant.name,
                url: DBHelper.urlForRestaurant(restaurant),
                map: map,
                animation: google.maps.Animation.DROP
            }
        );
        return marker;
    }

}
