FROM odoo:19.0

USER root
RUN mkdir -p /mnt/extra-addons/bridge /mnt/extra-addons/generated /mnt/extra-addons/custom /mnt/extra-addons/test_support
USER odoo
