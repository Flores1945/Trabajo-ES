package com.example.asistencialiceovirtual;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;

public class AlumnosAdapter extends RecyclerView.Adapter<AlumnosAdapter.AlumnoViewHolder> {

    private final List<Estudiante> items = new ArrayList<>();

    public void setItems(List<Estudiante> nuevos) {
        items.clear();
        if (nuevos != null) {
            items.addAll(nuevos);
        }
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public AlumnoViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_alumno, parent, false);
        return new AlumnoViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull AlumnoViewHolder holder, int position) {
        Estudiante e = items.get(position);
        holder.txtNombre.setText(e.getNombresCompletos());
        holder.txtDetalle.setText(holder.itemView.getContext().getString(
                R.string.alumnos_item_detalle,
                e.getGrado(),
                e.getSeccion()));
        int avatar = position % 2 == 0
                ? R.drawable.avatar_alumno_a
                : R.drawable.avatar_alumno_b;
        holder.imgAvatar.setImageResource(avatar);
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class AlumnoViewHolder extends RecyclerView.ViewHolder {
        final ImageView imgAvatar;
        final TextView txtNombre;
        final TextView txtDetalle;

        AlumnoViewHolder(@NonNull View itemView) {
            super(itemView);
            imgAvatar = itemView.findViewById(R.id.imgAvatarAlumno);
            txtNombre = itemView.findViewById(R.id.txtNombreAlumno);
            txtDetalle = itemView.findViewById(R.id.txtDetalleAlumno);
        }
    }
}
