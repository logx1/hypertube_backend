
set -e

npm run build
npm run start


exec "$@"



# while [ true ]
# do
# 	sleep 5
# 	echo "sleep"
# done
