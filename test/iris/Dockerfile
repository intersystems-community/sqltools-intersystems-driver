FROM store/intersystems/iris-community:2020.2.0.211.0

RUN iris start $ISC_PACKAGE_INSTANCENAME && \
    iris session $ISC_PACKAGE_INSTANCENAME -U%SYS '##class(Security.Users).UnExpireUserPasswords("*")' && \
    iris stop $ISC_PACKAGE_INSTANCENAME quietly 