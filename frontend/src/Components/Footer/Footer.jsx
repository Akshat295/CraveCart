import React from 'react'
import './Footer.css'
import { assets } from '../../assets/frontend_assets/assets'
const Footer = () => {
  return (
    <div className='footer' id='footer'>
      <div className="footer-content">
        <div className="footer-content-left">
            <img src={assets.logo} className='footer-logo' alt="" />
            <p>CraveCart is your trusted food delivery partner, connecting you with the best local restaurants to bring delicious, freshly prepared meals straight to your doorstep. With lightning-fast delivery, quality you can taste, and a seamless ordering experience, we make every meal special.</p>
            <div className="footer-social-icons">
                <img src={assets.facebook_icon} alt="" />
                <img src={assets.linkedin_icon} alt="" />
                <img src={assets.twitter_icon} alt="" />
            </div>
        </div>
        <div className="footer-content-center">
            <h2>COMPANY</h2>
            <ul>
                <li>Home</li>
                <li>About Us</li>
                <li>Delivery</li>
                <li>Privacy Policy</li>
            </ul>
        </div>
        <div className="footer-content-right">
            <h2>GET IN TOUCH</h2>
            <ul>
                <li>+91-9876543210</li>
                <li>contact@cravecart.com</li>
            </ul>
        </div>
      </div>
      <hr />
      <p className='footer-copyright'>Copyright 2026 &copy CraveCart.com - All Right Reserved. </p>
    </div>
  )
}

export default Footer
