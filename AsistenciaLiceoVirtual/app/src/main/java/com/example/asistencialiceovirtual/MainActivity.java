package com.example.asistencialiceovirtual;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.view.View;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class MainActivity extends AppCompatActivity {

    private View progressLogin;
    private Button btnLogin;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        EditText dniField = findViewById(R.id.txtEmail);
        EditText passwordField = findViewById(R.id.txtPass);
        btnLogin = findViewById(R.id.btnLogin);
        progressLogin = findViewById(R.id.progressLogin);
        TextView forgotPassword = findViewById(R.id.lblOlvidaste);

        btnLogin.setOnClickListener(v -> intentarLogin(dniField, passwordField));
        forgotPassword.setOnClickListener(v ->
                startActivity(new Intent(this, RegistroUsuarioActivity.class)));
    }

    private void intentarLogin(EditText dniField, EditText passwordField) {
        String dni = dniField.getText().toString();
        String pass = passwordField.getText().toString();
        if (dni.trim().isEmpty() || pass.isEmpty()) {
            Toast.makeText(this, R.string.login_campos_vacios, Toast.LENGTH_SHORT).show();
            return;
        }

        setLoading(true);
        FirebaseLoginHelper.login(this, dni, pass, new FirebaseLoginHelper.LoginListener() {
            @Override
            public void onSuccess(User user) {
                setLoading(false);
                Intent intent = new Intent(MainActivity.this, HomeActivity.class);
                intent.putExtra(HomeActivity.EXTRA_FULL_NAME, user.getFullName());
                intent.putExtra(HomeActivity.EXTRA_CARGO, user.getCargo());
                if (user.hasPhotoUrl()) {
                    intent.putExtra(HomeActivity.EXTRA_PHOTO_URL, user.getPhotoUrl());
                }
                startActivity(intent);
                finish();
            }

            @Override
            public void onFailure(String message) {
                setLoading(false);
                Toast.makeText(MainActivity.this, message, Toast.LENGTH_LONG).show();
            }
        });
    }

    private void setLoading(boolean loading) {
        progressLogin.setVisibility(loading ? View.VISIBLE : View.GONE);
        btnLogin.setEnabled(!loading);
    }
}
