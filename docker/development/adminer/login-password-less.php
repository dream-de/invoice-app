<?php

/**
 * Development-only Adminer plugin.
 *
 * Adminer still requires the configured PostgreSQL user and password.
 * This file exists so the Adminer development image has a stable extension point
 * for future local-only plugins without changing the production Docker setup.
 */
class AdminerLoginPasswordLess {
    function credentials() {
        return array(SERVER, $_GET["username"] ?? "", get_password());
    }
}
