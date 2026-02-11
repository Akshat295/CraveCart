import { createContext, useEffect, useState } from "react";
import axios from "axios";
export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {

    const [cartItems, setCartItems] = useState({});
    const url = "http://localhost:4000" ;
    const [token, setToken] = useState("") ;
    const[food_list,setFoodList] = useState([]);

    const addToCart = async (itemId) => {
        if (!cartItems[itemId]) {
            setCartItems((prev) => ({ ...prev, [itemId]: 1 }));
        } else {
            setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] + 1 }));
        }
        if (token) {
            await axios.post(url + "/api/cart/add" , {itemId}, {headers:{token}}) ;
        }
    }

    const removeFromCart = async (itemId) => {
        setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] - 1 }));
        if ( token ) {
            await axios.post(url + "/api/cart/remove", {itemId}, {headers:{token}});
        }
    }

    const getTotalCartAmount = () => {
        let totalAmount = 0;
        for (const item in cartItems) {
            if (cartItems[item] > 0) {
                let itemInfo = food_list.find((product) => product._id === item);
                totalAmount += itemInfo.price * cartItems[item];
            }
        }
        return totalAmount;
    }

    const fetchFoodList = async() => {
        const response = await axios.get(url+"/api/food/list") ;
        console.log(response.data.data);
        setFoodList(response.data.data) ;
    }

    const loadCartData = async (token) => {
        try {
            const response = await axios.post(url+"/api/cart/get",{},{headers:{token}});
            setCartItems(response.data.cartData || {});
        } catch (error) {
            console.error("[StoreContext] Failed to load cart data", error?.response?.data || error.message);
        }
    }

    useEffect(()=> {
        async function loadData() {
            await fetchFoodList() ;
            const savedToken = localStorage.getItem("token");

            // Clean up invalid tokens that can cause "jwt malformed"
            if (savedToken && savedToken !== "undefined" && savedToken !== "null" && savedToken.split(".").length === 3) {
                setToken(savedToken);
                await loadCartData(savedToken);
            } else {
                if (savedToken) {
                    console.warn("[StoreContext] Clearing invalid token from localStorage:", savedToken);
                }
                localStorage.removeItem("token");
                setToken("");
            }
        }
        loadData();
    },[])
    const contextValue = {
        food_list,
        cartItems,
        setCartItems,
        addToCart,
        removeFromCart,
        getTotalCartAmount,
        url,
        token,
        setToken
    }
    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    )
}

export default StoreContextProvider;