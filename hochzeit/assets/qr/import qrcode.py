import qrcode
from PIL import Image

# QR-Code erstellen
qr = qrcode.QRCode(
    version=1,
    error_correction=qrcode.constants.ERROR_CORRECT_H,
    box_size=10,
    border=4,
)
qr.add_data('https://helfen.dev/hochzeit')
qr.make(fit=True)

# QR-Code als Bild
img = qr.make_image(fill_color="#2d5016", back_color="white")

# Herz-Logo in der Mitte einfügen (Sie brauchen eine heart.png Datei)
logo = Image.open("C:\\Users\\jhelfen9616\\OneDrive - COSMO CONSULT AG\\Dokumente\\Privat\\Hochzeit\\hochzeit\\bilder\\heart.png")
logo = logo.resize((100, 100))
pos = ((img.size[0] - logo.size[0]) // 2, (img.size[1] - logo.size[1]) // 2)
img.paste(logo, pos)

img.save('hochzeit_qr.png')