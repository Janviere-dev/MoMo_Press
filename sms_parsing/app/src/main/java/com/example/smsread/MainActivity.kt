package com.example.smsread

import android.Manifest
import android.content.pm.PackageManager
import android.database.Cursor
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import java.io.File
import java.io.FileOutputStream
import java.io.OutputStreamWriter

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Check SMS permission at runtime
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_SMS)
            != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(Manifest.permission.READ_SMS),
                100
            )
        } else {
            saveMMoneyMessages()
        }
    }

    // Handle permission result
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == 100 && grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            saveMMoneyMessages()
        } else {
            Toast.makeText(this, "Permission denied", Toast.LENGTH_SHORT).show()
        }
    }

    private fun saveMMoneyMessages() {
        val uri = Uri.parse("content://sms/inbox")
        val projection = arrayOf("address", "body", "date")
        val selection = "address = ?"
        val selectionArgs = arrayOf("M-Money")

        val cursor: Cursor? = contentResolver.query(
            uri,
            projection,
            selection,
            selectionArgs,
            "date DESC"
        )

        try {
            val file = File(getExternalFilesDir(null), "mmoney_messages.xml")
            val fos = FileOutputStream(file)
            val writer = OutputStreamWriter(fos)

            writer.write(
                "<?xml version='1.0' encoding='utf-8'?>\n" +
                        "<smses>\n"
            )

            cursor?.use {
                while (it.moveToNext()) {
                    val address = it.getString(it.getColumnIndexOrThrow("address"))
                    val body = it.getString(it.getColumnIndexOrThrow("body"))
                    val date = it.getString(it.getColumnIndexOrThrow("date"))

                    writer.write(
                        "  <sms address=\"$address\" date=\"$date\" body=\"$body\" />\n"
                    )
                }
            }

            writer.write("</smses>")
            writer.close()
            fos.close()

            Toast.makeText(this, "Saved to: ${file.absolutePath}", Toast.LENGTH_LONG).show()
        } catch (e: Exception) {
            e.printStackTrace()
            Toast.makeText(this, "Error saving messages", Toast.LENGTH_SHORT).show()
        }
    }

    private fun escapeXml(text: String): String {
        return text.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&apos;")
    }
}
