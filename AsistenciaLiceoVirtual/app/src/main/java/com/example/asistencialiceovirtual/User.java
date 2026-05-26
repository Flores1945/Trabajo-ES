package com.example.asistencialiceovirtual;

import androidx.annotation.Nullable;

/**
 * Usuario autenticado (portal web / Firebase Auth).
 */
public final class User {

    private final String fullName;
    private final String cargo;
    @Nullable
    private final String photoUrl;

    public User(String fullName, String cargo, @Nullable String photoUrl) {
        this.fullName = fullName;
        this.cargo = cargo;
        this.photoUrl = photoUrl;
    }

    public String getFullName() {
        return fullName;
    }

    public String getCargo() {
        return cargo;
    }

    @Nullable
    public String getPhotoUrl() {
        return photoUrl;
    }

    public boolean hasPhotoUrl() {
        return photoUrl != null && !photoUrl.trim().isEmpty();
    }
}
