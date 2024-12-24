import { LightningElement, wire, track } from 'lwc';
import getProductsWithTotalCount from '@salesforce/apex/FavoriteItemsControllerWithToggle.getProductsWithTotalCount';
import updateFavoriteStatus from '@salesforce/apex/FavoriteItemsControllerWithToggle.updateFavoriteStatus';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

export default class FavoriteItemsWithFavoriteToggle extends LightningElement {
    @track products = [];
    @track currentPage = 1;
    @track totalProducts = 0;
    @track isLoading = false; // Spinner control
    pageSize = 6; // Products per page
    wiredResult;


    // Returns the total number of pages based on the total products and page size.
    get totalPages() {
        return Math.ceil(this.totalProducts / this.pageSize);
    }

    // Checks if the "Previous" button should be disabled based on the current page.
    get isPreviousDisabled() {
        return this.currentPage === 1;
    }

    // Checks if the "Next" button should be disabled based on the current page.
    get isNextDisabled() {
        return this.currentPage === this.totalPages;
    }

    // Wired method to fetch products data from the Apex controller with pagination.
    @wire(getProductsWithTotalCount, { pageNumber: '$currentPage', pageSize: '$pageSize' })
    wiredProducts(result) {
        this.wiredResult = result;
        if (result.data) {
            // Add the 'favoriteIcon' field dynamically for each product
            this.products = result.data.products.map(product => ({
                ...product,
                isFavorite: product.Is_Favorite__c, // assuming 'Is_Favorite__c' is the field
                favoriteIcon: product.Is_Favorite__c ? 'utility:favorite' : 'utility:favorite_alt' // Set icon dynamically
            }));
            this.totalProducts = result.data.totalProducts;
            this.isLoading = false;
        } else if (result.error) {
            console.error(result.error);
            this.showToast('Error' , 'Error while fetching data' , 'error');
            this.isLoading = false;
        }
    }

    // Handles the "Next" button click to move to the next page.
    handleNextPage() {
        if (!this.isNextDisabled) {
            this.isLoading = true; // Show spinner
            this.currentPage++;
        }
    }

    // Handles the "Previous" button click to move to the previous page.
    handlePrevPage() {
        if (!this.isPreviousDisabled) {
            this.isLoading = true; // Show spinner
            this.currentPage--;
        }
    }

    // Toggle favorite status on product
    toggleFavorite(event) {
        const productId = event.target.dataset.id;
        const product = this.products.find(p => p.Id === productId);
        const newFavoriteStatus = !product.isFavorite;

        // Call Apex to update favorite status in Salesforce
        updateFavoriteStatus({ productId: productId, isFavorite: newFavoriteStatus })
            .then(() => {
                console.log('Favorite status updated successfully');
                this.showToast('Success' , 'Favorite status updated successfully' , 'success');
                refreshApex(this.wiredResult);
            })
            .catch(error => {
                console.error('Error updating favorite status', error);
                this.showToast('Error' , 'Error updating favorite status' , 'error');
            });
    }

    // Method to display toast message to the user
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant
        });
        this.dispatchEvent(event);
    }
}