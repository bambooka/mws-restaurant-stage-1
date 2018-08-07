const dbName = 'restaurantDB';
const currentVersion = 2;
const restaurantStore = 'restaurantStore';
const reviewStore = 'reviewStore';

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
            upgradeDB.createObjectStore(restaurantStore, {keyPath: 'id'});
        case 1:
            const reviewsStore = upgradeDB.createObjectStore(reviewStore, {keyPath: 'id'});

            reviewsStore.createIndex('restaurant', 'restaurant_id');
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
            db.transaction(restaurantStore).objectStore(restaurantStore)
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
            const tx = db.transaction(restaurantStore, 'readwrite');
            restaurants.forEach(restaurant => {
                tx.objectStore(restaurantStore).put(restaurant);
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
        return restaurant.photograph ? `/img/${restaurant.photograph}.jpg` : '/img/placeholder.jpg';
    }

    /**
     * Restaurant responsive image URL.
     */
    static imageSrcSetForRestaurant(restaurant) {
        let photoId = restaurant.photograph ? restaurant.photograph : 'placeholder';
        return `/img/small${photoId}.jpg 550w, /img/${photoId}.jpg 1000w`;
    }

    static imageAltForRestaurant(restaurant) {
        return (`It's ${restaurant.name} restaurant. There has atmosphere this place: glad visitors, modern style, hall and kitchen zone.`);
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

    static updateFavoriteStatus(restaurantId, isFavorite) {
        fetch(`${this.DATABASE_URL}/${restaurantId}/?is_favorite=${isFavorite}`, {method: 'PUT'}).then(() => {

            dbPromise.then(db => {
                const tx = db.transaction(restaurantStore, 'readwrite');
                const restoStore = tx.objectStore(restaurantStore);
                restoStore.get(restaurantId).then(restaurant => {
                    restaurant.is_favorite = isFavorite;
                    restoStore.put(restaurant);
                })
            })
        })

    }


    /**
     * Fetch reviews
     */
    static fetchReviews(callback) {
        // First try to fetch reviews from the database
        dbPromise.then(db => {
            db.transaction(reviewStore).objectStore(reviewStore)
                .getAll().then(reviews => {

                if (reviews.length > 0) {
                    callback(null, reviews);
                    return;
                }

                // In case of an empty DB, fetch reviews from the network
                console.log('db is empty');
                DBHelper.fetchReviewsFromNetwork((error, reviews) => {
                    if (reviews != null) {
                        DBHelper.storeReviewsInDatabase(reviews)
                    }
                    callback(error, reviews);
                });
            });
        }).catch(reason => {
            callback(`db failed. ${reason}`, null);
        });
    }


    /**
     * Fetch reviews from the network
     */
    static fetchReviewsFromNetwork(callback) {
        let fetchReviewURL = 'http://localhost:1337/reviews';
        fetch(fetchReviewURL, {method: 'GET'}).then(response => {
            response.json().then(reviews => {
                callback(null, reviews);
            });
        }).catch(error => {
            callback(`network request failed. returned ${error}`, null);
        });
    }

    /**
     * Store all reviews from server in the database
     */
    static storeReviewsInDatabase(reviews) {
        console.log('store reviews in the db');
        dbPromise.then(db => {
            const tx = db.transaction(reviewStore, 'readwrite');
            reviews.forEach(review => {
                tx.objectStore(reviewStore).put(review);
            });
        });
    }

    /**
     * Filter reviews by restaurant id
     */
    static filterReviewsByRestaurantId(id, callback) {
        return DBHelper.fetchReviews((error, reviews) => {

            if (error) {
                callback(error, null);
            } else {
                const filter_reviews = reviews.filter(r => r.restaurant_id === id);
                if (filter_reviews) { // Got the reviews
                    callback(null, filter_reviews);
                } else { // Reviews does not exist in the database
                    callback('Reviews does not exist', null);
                }
            }

        });

    }



    /**
     * Send waiting data when online.
     */
    static sendDataWhenOnline(offline_object) {
        console.log('Offline OBJ', offline_object);

        localStorage.setItem('data', JSON.stringify(offline_object.data));

        console.log(`Local Storage: ${offline_object.object_type} stored`);

        window.addEventListener('online', (event) => {

            console.log('Browser: Online again!');
            let data = JSON.parse(localStorage.getItem('data'));
            console.log('updating and cleaning ui');

            [...document.querySelectorAll(".reviews_offline")]
                .forEach(el => {
                    el.classList.remove("reviews_offline");
                    el.querySelector(".offline_label").remove()
                });
            if (data !== null) {
                console.log(data);
                if (offline_object.name === 'addReview') {
                    DBHelper.addReview(offline_object.data);
                }

                console.log('LocalState: data sent to api');

                localStorage.removeItem('data');
                console.log(`Local Storage: ${offline_object.object_type} removed`);
            }
        });
    }

    /**
     * Store New Review in the database.
     */
    static storeNewReviewInDatabase(review){
        fetch(`http:localhost:1337/reviews`, {method: 'PUT'}).then(() => {

            dbPromise.then(db => {
                const tx = db.transaction(reviewStore, 'readwrite');
                const reviewPutStore = tx.objectStore(reviewStore);
                    reviewPutStore.put(review);

            })
        })
    }


    /**
     * push review to server
     */
    static pushReview(review) {

        let offline_object = {
            name: 'addReview',
            data: review,
            object_type: 'review'
        };

        // Check if online
        if (!navigator.onLine && (offline_object.name === 'addReview')) {
            DBHelper.sendDataWhenOnline(offline_object);
            return;
        }


        let reviewSend = {
            'name': review.name,
            'rating': parseInt(review.rating),
            'comments': review.comments,
            'restaurant_id': parseInt(review.restaurant_id)
        };

        console.log('Sending review: ', reviewSend);


        var fetch_data = {
            method: 'POST',
            body: JSON.stringify(reviewSend),
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        };



        fetch(`http://localhost:1337/reviews`, fetch_data).then((response) => {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.indexOf('application/json') !== -1) {
                return response.json();
            } else { return 'API call successfull'}})
            .then((data) => {console.log(`Fetch successful!`)})
            .catch(error => console.log('error:', error));

    }

}



