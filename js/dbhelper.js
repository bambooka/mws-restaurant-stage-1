const dbName = 'restaurantDB';
const currentVersion = 3;
const restaurantStore = 'restaurantStore';
const reviewStore = 'reviewStore';
const delayStore = 'delayStore';

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
            const reviewsStore = upgradeDB.createObjectStore(reviewStore, {keyPath: 'id', autoIncrement: true});

            reviewsStore.createIndex('restaurant', 'restaurant_id');
        case 2:
            upgradeDB.createObjectStore(delayStore, {keyPath: 'id', autoIncrement: true});
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
        // const port = 443;
        // const domain = '54.193.16.69';
        // return `https://54.193.16.69:${port}`;
        const port = 1337;
        const domain = 'localhost';
        return `${domain}:${port}`
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
console.log(restaurants)
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
        let fetchURL = `${DBHelper.DATABASE_URL}/restaurants`;
        console.log(fetchURL)
        fetch(fetchURL, {method: 'GET'}).then(response => {
            console.log(response)
            response.json().then(restaurants => {
                console.log(restaurants)
                console.log(restaurants)
                restaurants.forEach(r => {
                    r.is_favorite = r.is_favorite === 'true';
                });
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
        console.log(`/img/${restaurant.photograph}.jpg`);
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
        fetch(`${DBHelper.DATABASE_URL}/restaurants/${restaurantId}/?is_favorite=${isFavorite}`, {method: 'PUT'}).then(() => {

            dbPromise.then(db => {
                const tx = db.transaction(restaurantStore, 'readwrite');
                const restaurantsStore = tx.objectStore(restaurantStore);
                restaurantsStore.get(restaurantId).then(restaurant => {
                    restaurant.is_favorite = isFavorite;
                    restaurantsStore.put(restaurant);
                })
            })
        })

    }

    /**
     * Fetch reviews
     */
    static fetchReviews(id, callback) {
        // First try to fetch reviews from the database
        dbPromise.then(db => {
            db.transaction(reviewStore).objectStore(reviewStore)
                .getAll().then(reviews => {
                console.log(reviews);
                if (reviews.length > 0) {
                    const filter_reviews = reviews.filter(r => r.restaurant_id === id);

                    if (filter_reviews.length > 0) { // Got the reviews
                        callback(null, filter_reviews);
                    } else { // Reviews does not exist in the database

                        // In case of an empty DB, fetch reviews from the network
                        DBHelper.fetchReviewsFromNetwork(id, (error, reviews) => {
                            if (reviews != null) {
                                DBHelper.storeReviewsInDatabase(reviews)
                            }
                            callback(error, reviews);
                        });
                    }
                } else {
                    // In case needed reviews doesn't exist in a DB, fetch reviews from the network
                    DBHelper.fetchReviewsFromNetwork(id, (error, reviews) => {
                        if (reviews != null) {
                            DBHelper.storeReviewsInDatabase(reviews)
                        }
                        callback(error, reviews);
                    });
                }
            });
        }).catch(reason => {
            callback(`db failed. ${reason}`, null);
        });
    }

    /**
     * Fetch reviews from the network
     */
    static fetchReviewsFromNetwork(id, callback) {
        let fetchReviewURL = `${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${id}`;
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
     * Send waiting data when online.
     */
    static sendReviewWhenOnline(pending_review) {

        window.addEventListener('online', () => {

            let delayReviews = dbPromise.then(db => {
                db.transaction(delayStore, 'readwrite').objectStore(delayStore).getAll().then(reviews => {
                    return reviews;
                });

            });

            // Remove class for offline reviews.
            [...document.querySelectorAll(".reviews_pending")]
                .forEach(review_pending => {
                    review_pending.classList.remove("reviews_pending");
                });

            // push to server and clear delay store
            if (delayReviews !== null) {

                DBHelper.pushReview(pending_review);

                dbPromise.then(db => {
                    const tx = db.transaction(delayStore, 'readwrite');
                    tx.objectStore(delayStore).clear();
                });
            }
        });
    }

    /**
     * Store New Review in the database.
     */
    static storeNewReviewInDatabase(review) {

        dbPromise.then(db => {
            const tx = db.transaction(reviewStore, 'readwrite');
            tx.objectStore(reviewStore).put(review);
        })
    }

    /**
     * Store New Review in delay store in the database.
     */
    static storeNewDelayReviewInDatabase(review) {

        dbPromise.then(db => {
            const tx = db.transaction(delayStore, 'readwrite');
            tx.objectStore(delayStore).put(review);
        })
    }

    /**
     * Push review to server
     */
    static pushReview(review) {

        if (!navigator.onLine) {
            DBHelper.sendReviewWhenOnline(review);
            return;
        }

        let reviewContent = {
            'restaurant_id': parseInt(review.restaurant_id),
            'name': review.name,
            'rating': parseInt(review.rating),
            'comments': review.comments
        };

        let fetch_review = {
            method: 'POST',
            body: JSON.stringify(reviewContent),
            headers: new Headers({'Content-Type': 'application/json'})
        };

        // request to server for push review
        fetch(`${DBHelper.DATABASE_URL}/reviews`, fetch_review).then((response) => {
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.indexOf('application/json') !== -1) {
                return response.json();
            } else {
                return 'Something went wrong';
            }
        })
    }


}



